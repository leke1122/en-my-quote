import Link from "next/link";
import { APP_VERSION, RELEASE_NOTES_DISPLAY_LIMIT, getRecentReleaseNotes } from "@/lib/releaseNotes";

export default function ReleaseNotesPage() {
  const displayed = getRecentReleaseNotes();

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">版本说明</h1>
          <p className="mt-2 text-sm text-slate-600">
            当前版本：<span className="font-mono font-semibold text-slate-900">v{APP_VERSION}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">以下仅展示最近 {RELEASE_NOTES_DISPLAY_LIMIT} 次更新记录。</p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          返回首页
        </Link>
      </header>

      <section className="space-y-4">
        {displayed.map((item, idx) => (
          <article key={`${item.datetime}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">v{item.version}</h2>
              <span className="text-xs text-slate-500">{item.datetime}</span>
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
              {item.summary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

