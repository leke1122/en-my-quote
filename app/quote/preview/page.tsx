"use client";

import { Suspense } from "react";
import { QuoteSharePreviewClient } from "@/components/quote/QuoteSharePreviewClient";

export default function QuotePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600">Loading…</div>
      }
    >
      <QuoteSharePreviewClient />
    </Suspense>
  );
}
