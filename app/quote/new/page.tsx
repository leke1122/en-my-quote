import { Suspense } from "react";
import { QuoteEditor } from "@/components/quote/QuoteEditor";

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-slate-600">加载中</div>
      }
    >
      <QuoteEditor />
    </Suspense>
  );
}
