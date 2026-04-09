"use client";

import { Suspense } from "react";
import { ContractSharePreviewClient } from "@/components/contract/ContractSharePreviewClient";

export default function ContractPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600">Loading…</div>
      }
    >
      <ContractSharePreviewClient />
    </Suspense>
  );
}
