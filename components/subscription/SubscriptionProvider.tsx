"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/Modal";
import { TextButton } from "@/components/TextButton";
import {
  canAccessContracts,
  canAccessQuotes,
  canBridgeQuoteToContract,
  daysRemainingInSubscription,
  isEntitlementActive,
  isExpiringWithinDays,
  type MeSubscription,
} from "@/lib/subscriptionAccess";
import { formatDateYmdCn } from "@/lib/subscriptionPlanDisplay";

const POST_LOGIN_FLAG = "quote_post_login_subscription_check";

type MeJson =
  | { ok: true; loggedIn: false; cloud?: boolean }
  | {
      ok: true;
      loggedIn: true;
      cloud: true;
      user: { id: string; email: string };
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

/** 未包裹 Provider 时（测试/Story）可安全降级为不启用云端门禁 */
export function useSubscriptionAccessOptional(): SubscriptionAccessContextValue | null {
  return useContext(SubscriptionAccessContext);
}

function openShop(url: string) {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
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
      const until = sub?.validUntil ? formatDateYmdCn(sub.validUntil) : "—";
      setDetail(
        left !== null
          ? `当前套餐将在 ${until} 到期，剩余约 ${left} 个自然日。续费后请在「设置 → 个人信息」兑换激活码。`
          : `当前套餐即将到期（至 ${until}）。续费后请在「设置 → 个人信息」兑换激活码。`
      );
      setOpen("expiring");
    }
  }, [ctx.loading, ctx.cloudAuthEnabled, ctx.loggedIn, ctx.entitlementActive, ctx.subscription]);

  if (!open) return null;

  const shop = ctx.purchaseShopUrl;

  return (
    <Modal
      open
      title={open === "expired" ? "订阅已失效" : "订阅即将到期"}
      onClose={() => setOpen(null)}
      footer={
        <>
          <TextButton variant="secondary" onClick={() => setOpen(null)}>
            知道了
          </TextButton>
          {open === "expired" ? (
            <TextButton variant="primary" onClick={() => openShop(shop)}>
              打开淘宝店铺
            </TextButton>
          ) : (
            <TextButton
              variant="primary"
              onClick={() => {
                setOpen(null);
                router.push("/settings");
              }}
            >
              去设置兑换续费
            </TextButton>
          )}
        </>
      }
    >
      {open === "expired" ? (
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>当前账号没有有效订阅（试用已结束或未兑换激活码）。报价与合同相关功能已暂停，但您仍可在「设置」中导出本地历史数据。</p>
          <p>
            请前往淘宝店铺购买激活码，并在{" "}
            <Link href="/settings" className="font-medium text-slate-900 underline-offset-2 hover:underline">
              设置 → 个人信息
            </Link>{" "}
            中粘贴兑换。
          </p>
          <a
            href={shop}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-xs text-slate-800 underline-offset-2 hover:underline"
          >
            {shop}
          </a>
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
  const [purchaseShopUrl, setPurchaseShopUrl] = useState("https://hcwnn1122.taobao.com");
  const [trialDays, setTrialDays] = useState(14);
  const [me, setMe] = useState<MeJson | null>(null);

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
