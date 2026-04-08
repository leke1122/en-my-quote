import type { Metadata } from "next";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://app.quote.zxaigc.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "智序签单",
    template: "%s | 智序签单",
  },
  description:
    "用于中小团队的报价单与销售合同生成工具，支持手机端操作、历史记录查询、图片/PDF 导出与本地数据备份。",
  keywords: ["报价单生成", "销售合同生成", "报价管理", "合同管理", "移动端报价工具"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "智序签单",
    description:
      "报价与合同一体化工具：支持商品/客户管理、报价合同生成、图片与 PDF 导出、手机端使用。",
    url: siteUrl,
    siteName: "智序签单",
    locale: "zh_CN",
    type: "website",
  },
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
