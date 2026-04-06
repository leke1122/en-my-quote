"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";

const gridRow23 = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:items-stretch";

const cardClass =
  "flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md sm:min-h-[3.5rem] sm:gap-4 sm:p-5";

const row2 = [
  { href: "/quote/new", title: "新建报价", emoji: "📝", feature: "quote" as const },
  { href: "/quote", title: "查询历史报价", emoji: "📋", feature: "quote" as const },
];

const row3 = [
  { href: "/contract/new", title: "新建合同", emoji: "📄", feature: "contract" as const },
  { href: "/contract", title: "查询合同", emoji: "📑", feature: "contract" as const },
];

type BlockKind = "register" | "inactive" | "upgrade-quote" | "upgrade-contract" | null;

export function HomeGatedNav() {
  const router = useRouter();
  const ctx = useSubscriptionAccess();
  const [block, setBlock] = useState<BlockKind>(null);

  function openShop() {
    window.open(ctx.purchaseShopUrl, "_blank", "noopener,noreferrer");
  }

  function tryGo(href: string, feature: "quote" | "contract") {
    if (ctx.loading) return;
    if (!ctx.cloudAuthEnabled) {
      router.push(href);
      return;
    }
    if (!ctx.loggedIn) {
      setBlock("register");
      return;
    }
    if (!ctx.entitlementActive) {
      setBlock("inactive");
      return;
    }
    if (feature === "quote" && !ctx.canQuote) {
      setBlock("upgrade-quote");
      return;
    }
    if (feature === "contract" && !ctx.canContract) {
      setBlock("upgrade-contract");
      return;
    }
    router.push(href);
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <nav className={gridRow23} aria-label="报价">
        {row2.map((c) => (
          <button key={c.href} type="button" className={cardClass} onClick={() => tryGo(c.href, c.feature)}>
            <span className="text-2xl sm:text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="text-sm font-medium text-slate-800 sm:text-base">{c.title}</span>
          </button>
        ))}
      </nav>
      <nav className={gridRow23} aria-label="合同">
        {row3.map((c) => (
          <button key={c.href} type="button" className={cardClass} onClick={() => tryGo(c.href, c.feature)}>
            <span className="text-2xl sm:text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="text-sm font-medium text-slate-800 sm:text-base">{c.title}</span>
          </button>
        ))}
      </nav>

      <Modal
        open={block === "register"}
        title="请先注册登录"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              关闭
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/register")}>
              去注册
            </TextButton>
            <TextButton variant="primary" onClick={() => router.push("/login")}>
              去登录
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          使用报价与合同功能前，请先注册并登录云端账号。您的业务数据仍保存在本机，可随时在「设置」中导出。
        </p>
      </Modal>

      <Modal
        open={block === "inactive"}
        title="订阅未激活或已过期"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              关闭
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/settings")}>
              去设置兑换
            </TextButton>
            <TextButton variant="primary" onClick={openShop}>
              打开淘宝店铺
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          请在淘宝购买激活码，并在「设置 → 个人信息」粘贴兑换。订阅失效期间仍可登录并在「设置」导出本地数据。
        </p>
        <a
          href={ctx.purchaseShopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-mono text-xs text-slate-700 underline-offset-2 hover:underline"
        >
          {ctx.purchaseShopUrl}
        </a>
      </Modal>

      <Modal
        open={block === "upgrade-quote" || block === "upgrade-contract"}
        title="请升级套餐"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              关闭
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/settings")}>
              查看订阅
            </TextButton>
            <TextButton variant="primary" onClick={openShop}>
              前往淘宝店铺
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          {block === "upgrade-quote"
            ? "您当前的套餐不包含「报价」功能。请购买含报价模块或「报价+合同版」，并在设置中兑换激活码。"
            : "您当前的套餐不包含「合同」功能。请购买含合同模块或「报价+合同版」，并在设置中兑换激活码。"}
        </p>
      </Modal>
    </div>
  );
}
