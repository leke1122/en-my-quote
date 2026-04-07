"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ConfigJson = { purchaseShopUrl?: string };

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p> : null}
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          返回首页
        </Link>
      </div>
      {children}
    </section>
  );
}

function Shot({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      title="点击打开原图（可放大查看）"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-auto max-w-full rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:shadow-md"
      />
      <div className="mt-2 text-center text-xs text-slate-500">点击图片打开原图（可放大查看）</div>
    </a>
  );
}

export default function HelpPage() {
  const [shopUrl, setShopUrl] = useState("https://hcwnn1122.taobao.com");
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/auth/config")
      .then((r) => r.json() as Promise<ConfigJson>)
      .then((j) => {
        if (typeof j.purchaseShopUrl === "string" && j.purchaseShopUrl.trim()) setShopUrl(j.purchaseShopUrl.trim());
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">使用说明</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            本页无需登录即可查看。重点：手机端也能直接生成报价/合同，并可导出图片或 PDF 发送给客户查看（分享链接为只读预览）。
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              const res = await fetch("/api/auth/me", { credentials: "include" });
              const j = (await res.json()) as { loggedIn?: boolean };
              if (res.ok && j && j.loggedIn) {
                router.push("/settings");
              } else {
                router.push("/login");
              }
            } catch {
              router.push("/login");
            }
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          去设置（激活码/导出）
        </button>
      </header>

      <div className="space-y-6 sm:space-y-8">
        <Section
          title="1. 系统能做什么？解决什么痛点？"
          subtitle="把“商品/客户资料 + 报价 + 合同 + 导出/分享”串成一个轻量流程，特别适合电脑/手机临时报价与签单。"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">常见痛点</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>外出/现场沟通时，临时改价、补充条款很麻烦。</li>
                <li>不同版本报价单在微信/群里来回传，容易错用旧版。</li>
                <li>合同复用困难：又要从报价复制粘贴，效率低且易出错。</li>
              </ul>
              <p className="mt-4 font-medium text-slate-900">本系统提供</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>商品/客户/我司资料管理；报价与合同一体化。</li>
                <li>一键导出报价/合同为图片或 PDF（适配手机）。</li>
                <li>分享给客户只读预览，避免对方误改内容。</li>
                <li>数据默认在当前浏览器本地保存，并支持在设置中导出备份。</li>
              </ul>
            </div>
            <Shot src="/help/1.png" alt="首页与功能入口" />
          </div>
        </Section>

        <Section title="2. 商品管理：维护商品资料与图片" subtitle="先把常用商品录入，后续报价/合同可快速选取。">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">你可以做什么</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>新增/编辑商品：编码、名称、型号、规格、单位、单价。</li>
                <li>上传商品图片：报价单里可选择显示或隐藏图片列。</li>
              </ul>
              <p className="text-slate-600">
                建议先维护 10～30 个高频商品，现场报价会更快。
              </p>
            </div>
            <Shot src="/help/2.png" alt="商品管理与新增商品" />
          </div>
        </Section>

        <Section title="3. 客户管理：维护客户资料" subtitle="维护客户名称、联系人、电话、地址等信息。">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">你可以做什么</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>新增/编辑客户：客户编码、联系人、电话、地址、主营项目等。</li>
                <li>在新建报价/合同页通过搜索快速选客户；也可快速新建。</li>
              </ul>
            </div>
            <Shot src="/help/3.png" alt="客户管理与新增客户" />
          </div>
        </Section>

        <Section
          title="4. 报价查询：筛选、导出、继续编辑"
          subtitle="按日期/客户/商品等条件筛选历史报价，并可导出 CSV/Excel。"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">典型用法</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>快速找到最近一份报价，点击进入继续编辑并另存新单。</li>
                <li>把筛选结果导出为 CSV/Excel，方便内部统计。</li>
              </ul>
              <p className="text-slate-600">
                提示：建议通过 HTTPS 访问，并在「设置」中定期导出备份。
              </p>
            </div>
            <Shot src="/help/4.png" alt="查询历史报价与筛选导出" />
          </div>
        </Section>

        <Section
          title="5. 生成报价单（电脑/手机通用）"
          subtitle="在新建报价页选择我司与客户、添加商品、填写单价/数量/条款，最后导出图片或 PDF。"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">步骤</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>进入「新建报价」选择供方（我司）与客户。</li>
                <li>添加商品，录入单价与数量；必要时添加其他费用与条款。</li>
                <li>点击「生成图片」或「生成PDF」，即可在手机端直接保存并转发。</li>
                <li>点击「分享报价」可生成只读预览链接/二维码（客户打开只能看，不能编辑）。</li>
              </ol>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-semibold">重点：手机端可直接导出</p>
                <p className="mt-1 leading-relaxed">
                  无需电脑，现场用手机生成报价单后，直接导出图片或 PDF，通过微信等方式发给客户即可。
                </p>
              </div>
            </div>
            <Shot src="/help/5.png" alt="新建报价与导出图片/PDF/分享" />
          </div>
        </Section>

        <Section
          title="6. 合同查询：筛选、导出、继续编辑"
          subtitle="按签订日期/客户/商品等条件筛选历史合同，并可导出 CSV/Excel。"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">典型用法</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>快速定位某客户的合同记录，便于复核条款与金额。</li>
                <li>导出列表用于台账统计与内部归档。</li>
              </ul>
            </div>
            <Shot src="/help/6.png" alt="查询合同与筛选导出" />
          </div>
        </Section>

        <Section
          title="7. 生成合同单（电脑/手机通用）"
          subtitle="支持直接新建合同，也支持从历史报价一键生成合同并再调整。"
        >
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">你可以这样做</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>直接新建合同：填合同编号、签订时间地点、标的明细与条款。</li>
                <li>
                  从历史报价生成合同：在合同页点击「从报价生成…」，选择一份已保存报价，自动带入明细与默认条款。
                </li>
                <li>手机端同样支持「生成图片 / 生成PDF / 分享合同（只读预览）」并直接发给客户。</li>
              </ul>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                <p className="font-semibold">重点：手机端可直接导出</p>
                <p className="mt-1 leading-relaxed">
                  外出签单场景下，用手机生成合同并导出图片或 PDF，客户查看更直观，沟通更高效。
                </p>
              </div>
            </div>
            <Shot src="/help/7.png" alt="新建合同、从报价生成、导出与分享" />
          </div>
        </Section>

        <Section
          title="8. 手机端界面预览"
          subtitle="下方为在手机上使用时的实际界面截图，点击任意图片可放大查看。"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Shot src="/help/mobile-home.png" alt="手机端首页与功能入口" />
            <Shot src="/help/mobile-products.png" alt="手机端商品管理与新增商品" />
            <Shot src="/help/mobile-customers.png" alt="手机端客户管理与新增客户" />
            <Shot src="/help/mobile-company.png" alt="手机端我司信息管理与新增主体" />
            <Shot src="/help/mobile-quotes-list.png" alt="手机端查询历史报价与导出" />
            <Shot src="/help/mobile-quote-new.png" alt="手机端新建报价单并生成图片/PDF" />
            <Shot src="/help/mobile-contract-new.png" alt="手机端新建合同并从报价生成" />
            <Shot src="/help/mobile-quote-preview.png" alt="报价单导出预览示例" />
            <Shot src="/help/mobile-contract-preview.png" alt="合同导出预览示例" />
          </div>
        </Section>

        <section className="rounded-2xl border-2 border-amber-500/90 bg-gradient-to-br from-amber-50 to-orange-50/80 p-6 shadow-md">
          <h2 className="text-lg font-bold tracking-tight text-amber-950">购买激活码 / 续费</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
            需要开通套餐后，才能使用完整的报价/合同能力。请前往淘宝店铺购买激活码，并在「设置 → 个人信息」粘贴兑换。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 hover:shadow-lg"
            >
              打开淘宝店铺购买激活码
            </a>
            <Link
              href="/settings"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-amber-300 bg-white px-6 text-sm font-bold text-amber-900 shadow-sm hover:bg-amber-50"
            >
              去设置兑换激活码
            </Link>
          </div>
          <p className="mt-3 break-all font-mono text-[11px] text-amber-900/70">{shopUrl}</p>
        </section>
      </div>
    </div>
  );
}

