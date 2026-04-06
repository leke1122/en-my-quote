import type { Metadata } from "next";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "智序商业报价合同生成系统",
  description: "简洁高效，移动端优化，随时报价与合同，数据安全支持导出",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SubscriptionProvider>{children}</SubscriptionProvider>
      </body>
    </html>
  );
}
