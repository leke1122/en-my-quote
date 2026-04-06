"use client";

import { Suspense } from "react";
import { ContractEditor } from "@/components/contract/ContractEditor";
import { SubscriptionFeatureGate } from "@/components/subscription/SubscriptionFeatureGate";

export default function NewContractPage() {
  return (
    <SubscriptionFeatureGate feature="contract">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-slate-600">加载中</div>
        }
      >
        <ContractEditor />
      </Suspense>
    </SubscriptionFeatureGate>
  );
}
