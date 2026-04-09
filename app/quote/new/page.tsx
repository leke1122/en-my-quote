"use client";

import { Suspense } from "react";
import { QuoteEditor } from "@/components/quote/QuoteEditor";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";

export default function NewQuotePage() {
  return (
    <SubscriptionFeatureGate feature="quote">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-slate-600">Loading…</div>
        }
      >
        <QuoteEditor />
      </Suspense>
    </SubscriptionFeatureGate>
  );
}
