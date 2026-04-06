"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TextButton } from "@/components/TextButton";
import { useSubscriptionAccess } from "./SubscriptionProvider";

export type GatedFeature = "base" | "quote" | "contract";

function openShop(url: string) {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

export function SubscriptionFeatureGate({ feature, children }: { feature: GatedFeature; children: ReactNode }) {
  const ctx = useSubscriptionAccess();
  const router = useRouter();

  const title =
    feature === "quote" ? "报价功能" : feature === "contract" ? "合同功能" : "基础资料";

  if (ctx.loading) {
    return (
      <div className="mx-auto min-h-screen max-w-4xl px-4 py-16 text-center text-sm text-slate-600">加载中…</div>
    );
  }

  if (!ctx.cloudAuthEnabled) {
    return <>{children}</>;
  }

  if (!ctx.loggedIn) {
    return (
      <BlockedLayout
        title={title}
        headline="请先注册并登录云端账号"
        body="使用报价或合同相关能力前，需要注册账号以便订阅与激活。业务数据仍保存在本机浏览器，可随时在「设置」中导出。"
        primary={
          <TextButton variant="primary" onClick={() => router.push("/register")}>
            去注册
          </TextButton>
        }
        secondary={
          <TextButton variant="secondary" onClick={() => router.push("/login")}>
            已有账号，去登录
          </TextButton>
        }
      />
    );
  }

  if (!ctx.entitlementActive) {
    return (
      <BlockedLayout
        title={title}
        headline="订阅未激活或已过期"
        body="请在淘宝店铺购买激活码，并在「设置 → 个人信息」中粘贴兑换。订阅失效期间仍可登录并在「设置」导出本地历史数据，避免数据无法取出。"
        primary={<TextButton variant="primary" onClick={() => openShop(ctx.purchaseShopUrl)}>打开淘宝店铺</TextButton>}
        secondary={
          <TextButton variant="secondary" onClick={() => router.push("/settings")}>
            去设置兑换激活码
          </TextButton>
        }
        shopUrl={ctx.purchaseShopUrl}
      />
    );
  }

  // 基础资料页：仅要求登录 + 订阅有效，不再按套餐细分 quote/contract 权益
  if (feature === "base") return <>{children}</>;

  const allowed = feature === "quote" ? ctx.canQuote : ctx.canContract;
  if (!allowed) {
    const hint = feature === "quote" ? "您当前套餐不包含「报价」功能。" : "您当前套餐不包含「合同」功能。";
    return (
      <BlockedLayout
        title={title}
        headline="请升级套餐"
        body={`${hint} 需购买包含所需模块的套餐后，在设置中兑换激活码即可解锁。数据仍在本地，可随时导出。`}
        primary={<TextButton variant="primary" onClick={() => openShop(ctx.purchaseShopUrl)}>前往淘宝店铺升级</TextButton>}
        secondary={
          <TextButton variant="secondary" onClick={() => router.push("/settings")}>
            查看订阅与激活码
          </TextButton>
        }
        shopUrl={ctx.purchaseShopUrl}
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
  shopUrl,
}: {
  title: string;
  headline: string;
  body: string;
  primary: ReactNode;
  secondary: ReactNode;
  shopUrl?: string;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <PageHeader title={title} />
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{headline}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{body}</p>
        {shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-xs text-amber-900 underline-offset-2 hover:underline"
          >
            {shopUrl}
          </a>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {primary}
          {secondary}
        </div>
        <p className="mt-4 text-xs text-amber-900/80">
          <Link href="/" className="underline-offset-2 hover:underline">
            返回首页
          </Link>
          {" · "}
          <Link href="/settings" className="underline-offset-2 hover:underline">
            设置（含数据导出）
          </Link>
        </p>
      </div>
    </div>
  );
}
