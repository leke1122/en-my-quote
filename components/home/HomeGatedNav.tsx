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
  { href: "/quote/new", title: "New quote", emoji: "📝", feature: "quote" as const },
  { href: "/quote", title: "My quotes", emoji: "📋", feature: "quote" as const },
];

const row3 = [
  { href: "/contract/new", title: "New contract", emoji: "📄", feature: "contract" as const },
  { href: "/contract", title: "My contracts", emoji: "📑", feature: "contract" as const },
];

type BlockKind = "register" | "inactive" | "upgrade-quote" | "upgrade-contract" | null;

export function HomeGatedNav() {
  const router = useRouter();
  const ctx = useSubscriptionAccess();
  const [block, setBlock] = useState<BlockKind>(null);

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
      <nav className={gridRow23} aria-label="Quotes">
        {row2.map((c) => (
          <button key={c.href} type="button" className={cardClass} onClick={() => tryGo(c.href, c.feature)}>
            <span className="text-2xl sm:text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <span className="text-sm font-medium text-slate-800 sm:text-base">{c.title}</span>
          </button>
        ))}
      </nav>
      <nav className={gridRow23} aria-label="Contracts">
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
        title="Sign in to continue"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              Close
            </TextButton>
            <TextButton variant="secondary" onClick={() => router.push("/register")}>
              Sign up
            </TextButton>
            <TextButton variant="primary" onClick={() => router.push("/login")}>
              Sign in
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          Create an account and sign in to access Quotes and Contracts.
        </p>
      </Modal>

      <Modal
        open={block === "inactive"}
        title="Subscription required"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              Close
            </TextButton>
            <TextButton variant="primary" onClick={() => router.push("/pricing")}>
              View pricing
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          Start a subscription to unlock this feature. Secure checkout is handled by our payment provider.
        </p>
      </Modal>

      <Modal
        open={block === "upgrade-quote" || block === "upgrade-contract"}
        title="Upgrade required"
        onClose={() => setBlock(null)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setBlock(null)}>
              Close
            </TextButton>
            <TextButton variant="primary" onClick={() => router.push("/pricing")}>
              View pricing
            </TextButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-700">
          {block === "upgrade-quote"
            ? "Your current plan doesn’t include Quotes."
            : "Your current plan doesn’t include Contracts."}
        </p>
      </Modal>
    </div>
  );
}
