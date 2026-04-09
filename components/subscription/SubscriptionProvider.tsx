"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { TextButton } from "@/components/TextButton";
import { pullProjectDataFromCloud } from "@/lib/cloudProjectData";
import {
  canAccessContracts,
  canAccessQuotes,
  canBridgeQuoteToContract,
  daysRemainingInSubscription,
  isEntitlementActive,
  isExpiringWithinDays,
  type MeSubscription,
} from "@/lib/subscriptionAccess";
import { formatDateUS } from "@/lib/format";

const POST_LOGIN_FLAG = "quote_post_login_subscription_check";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | {
      ok: true;
      loggedIn: true;
      cloud: true;
      user: { id: string; email: string };
      lastLoginAt?: string | null;
      subscription: MeSubscription | null;
    };

type ConfigJson = {
  cloudAuthEnabled?: boolean;
  trialDays?: number;
  purchaseShopUrl?: string;
};

export type SubscriptionAccessContextValue = {
  loading: boolean;
  cloudAuthEnabled: boolean;
  purchaseShopUrl: string;
  trialDays: number;
  me: MeJson | null;
  loggedIn: boolean;
  subscription: MeSubscription | null;
  entitlementActive: boolean;
  canQuote: boolean;
  canContract: boolean;
  canQuoteToContract: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionAccessContext = createContext<SubscriptionAccessContextValue | null>(null);

export function useSubscriptionAccess(): SubscriptionAccessContextValue {
  const v = useContext(SubscriptionAccessContext);
  if (!v) {
    throw new Error("useSubscriptionAccess must be used within SubscriptionProvider");
  }
  return v;
}

/** Safe fallback when Provider is missing (tests / Storybook) */
export function useSubscriptionAccessOptional(): SubscriptionAccessContextValue | null {
  return useContext(SubscriptionAccessContext);
}

function PostLoginSubscriptionAlert({
  ctx,
}: {
  ctx: SubscriptionAccessContextValue;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"expired" | "expiring" | null>(null);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (ctx.loading || !ctx.cloudAuthEnabled) return;
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(POST_LOGIN_FLAG) === "1";
    } catch {
      return;
    }
    if (!flagged) return;
    if (!ctx.loggedIn) return;

    try {
      sessionStorage.removeItem(POST_LOGIN_FLAG);
    } catch {
      /* ignore */
    }

    const active = ctx.entitlementActive;
    const sub = ctx.subscription;

    if (!active) {
      setOpen("expired");
      setDetail("");
      return;
    }

    if (isExpiringWithinDays(sub, true, 3)) {
      const left = daysRemainingInSubscription(sub);
      const until = sub?.validUntil ? formatDateUS(sub.validUntil) : "—";
      setDetail(
        left !== null
          ? `Your subscription ends on ${until} (about ${left} calendar day(s) left). Renew to keep access.`
          : `Your subscription is ending soon (${until}). Renew to keep access.`
      );
      setOpen("expiring");
    }
  }, [ctx.loading, ctx.cloudAuthEnabled, ctx.loggedIn, ctx.entitlementActive, ctx.subscription]);

  if (!open) return null;

  return (
    <Modal
      open
      title={open === "expired" ? "Subscription inactive" : "Subscription ending soon"}
      onClose={() => setOpen(null)}
      footer={
        <>
          <TextButton variant="secondary" onClick={() => setOpen(null)}>
            OK
          </TextButton>
          {open === "expired" ? (
            <TextButton variant="primary" onClick={() => router.push("/pricing")}>
              View pricing
            </TextButton>
          ) : (
            <TextButton
              variant="primary"
              onClick={() => {
                setOpen(null);
                router.push("/pricing");
              }}
            >
              Renew
            </TextButton>
          )}
        </>
      }
    >
      {open === "expired" ? (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            There is no active subscription on this account. Quotes and contracts are blocked until you subscribe.
            You can still{" "}
            <Link href="/settings" className="font-medium text-slate-900 underline-offset-2 hover:underline">
              Settings
            </Link>{" "}
            to export local data.
          </p>
          <p>Start a subscription with secure Stripe checkout.</p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{detail}</p>
      )}
    </Modal>
  );
}

export function markPostLoginSubscriptionCheck() {
  try {
    sessionStorage.setItem(POST_LOGIN_FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [cloudAuthEnabled, setCloudAuthEnabled] = useState(false);
  const [purchaseShopUrl, setPurchaseShopUrl] = useState("");
  const [trialDays, setTrialDays] = useState(14);
  const [me, setMe] = useState<MeJson | null>(null);
  const [cloudDataInited, setCloudDataInited] = useState(false);

  const refresh = useCallback(async () => {
    const [cfgRes, meRes] = await Promise.all([
      fetch("/api/auth/config").then((r) => r.json() as Promise<ConfigJson>),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json() as Promise<MeJson>),
    ]);
    setCloudAuthEnabled(!!cfgRes.cloudAuthEnabled);
    if (typeof cfgRes.purchaseShopUrl === "string" && cfgRes.purchaseShopUrl.trim()) {
      setPurchaseShopUrl(cfgRes.purchaseShopUrl.trim());
    }
    if (typeof cfgRes.trialDays === "number") setTrialDays(cfgRes.trialDays);
    setMe(meRes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, refresh]);

  const loggedIn = Boolean(me && "loggedIn" in me && me.loggedIn && me.cloud);
  const subscription = loggedIn && me && "loggedIn" in me && me.loggedIn ? me.subscription : null;

  useEffect(() => {
    if (!loggedIn) setCloudDataInited(false);
  }, [loggedIn]);

  useEffect(() => {
    if (loading) return;
    if (!cloudAuthEnabled || !loggedIn || cloudDataInited) return;
    let cancelled = false;
    void (async () => {
      const res = await pullProjectDataFromCloud();
      if (!cancelled) {
        setCloudDataInited(true);
      }
      if (!res.ok) {
        // Non-blocking: user can keep using local data
        console.warn("[cloud-data] pull failed:", res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, cloudAuthEnabled, loggedIn, cloudDataInited]);

  const entitledDb = isEntitlementActive(subscription);
  const entitlementActive = !cloudAuthEnabled || entitledDb;
  const canQuote = !cloudAuthEnabled || canAccessQuotes(subscription, entitledDb);
  const canContract = !cloudAuthEnabled || canAccessContracts(subscription, entitledDb);
  const canQuoteToContract = !cloudAuthEnabled || canBridgeQuoteToContract(subscription, entitledDb);

  const value = useMemo(
    () => ({
      loading,
      cloudAuthEnabled,
      purchaseShopUrl,
      trialDays,
      me,
      loggedIn,
      subscription,
      entitlementActive,
      canQuote,
      canContract,
      canQuoteToContract,
      refresh,
    }),
    [
      loading,
      cloudAuthEnabled,
      purchaseShopUrl,
      trialDays,
      me,
      loggedIn,
      subscription,
      entitlementActive,
      canQuote,
      canContract,
      canQuoteToContract,
      refresh,
    ]
  );

  return (
    <SubscriptionAccessContext.Provider value={value}>
      {children}
      {!loading && cloudAuthEnabled ? <PostLoginSubscriptionAlert ctx={value} /> : null}
    </SubscriptionAccessContext.Provider>
  );
}
