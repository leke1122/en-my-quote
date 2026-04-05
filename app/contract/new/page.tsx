import { Suspense } from "react";
import { ContractEditor } from "@/components/contract/ContractEditor";

export default function NewContractPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-slate-600">加载中</div>
      }
    >
      <ContractEditor />
    </Suspense>
  );
}
