"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { useT } from "@/components/i18n/I18nProvider";
import { useSubscriptionAccess } from "./SubscriptionProvider";

export type GatedFeature = "base" | "quote" | "contract";

export function SubscriptionFeatureGate({ feature, children }: { feature: GatedFeature; children: ReactNode }) {
  const ctx = useSubscriptionAccess();
  const router = useRouter();
  const t = useT();

  const title =
    feature === "quote"
      ? t("subscriptionGate.titleQuote")
      : feature === "contract"
        ? t("subscriptionGate.titleContract")
        : t("subscriptionGate.titleBase");

  if (ctx.loading) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-16 text-center text-sm text-slate-600">
        {t("common.loading")}
      </div>
    );
  }

  if (!ctx.cloudAuthEnabled) {
    return <>{children}</>;
  }

  if (!ctx.loggedIn) {
    return (
      <BlockedLayout
        title={title}
        headline={t("subscriptionGate.needAccountHeadline")}
        body={t("subscriptionGate.needAccountBody")}
        primary={
          <TextButton variant="primary" onClick={() => router.push("/register")}>
            {t("common.signUp")}
          </TextButton>
        }
        secondary={
          <TextButton variant="secondary" onClick={() => router.push("/login")}>
            {t("common.signIn")}
          </TextButton>
        }
      />
    );
  }

  if (!ctx.entitlementActive) {
    return (
      <BlockedLayout
        title={title}
        headline={t("subscriptionGate.expiredHeadline")}
        body={t("subscriptionGate.expiredBody")}
        primary={
          <TextButton variant="primary" onClick={() => router.push("/pricing")}>
            {t("subscriptionGate.manageSubscription")}
          </TextButton>
        }
      />
    );
  }

  // Base data: login + active subscription; no per-plan quote/contract split
  if (feature === "base") return <>{children}</>;

  const allowed = feature === "quote" ? ctx.canQuote : ctx.canContract;
  if (!allowed) {
    return (
      <BlockedLayout
        title={title}
        headline={t("subscriptionGate.upgradeHeadline")}
        body={t("subscriptionGate.upgradeBody")}
        primary={
          <TextButton variant="primary" onClick={() => router.push("/pricing")}>
            {t("subscriptionGate.manageSubscription")}
          </TextButton>
        }
      />
    );
  }

  return <>{children}</>;
}

function BlockedLayout({
  title,
  headline,
  body,
  primary,
  secondary,
}: {
  title: string;
  headline: string;
  body: string;
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <PageHeader title={title} />
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{headline}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {primary}
          {secondary ?? null}
        </div>
        <p className="mt-4 text-xs text-amber-900/80">
          <Link href="/" className="underline-offset-2 hover:underline">
            {t("common.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
