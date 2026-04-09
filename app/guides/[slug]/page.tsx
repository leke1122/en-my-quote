import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { GUIDES, getGuideBySlug } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getGuideBySlug(params.slug);
  if (!post) {
    return {
      title: "Guide",
      alternates: { canonical: `/guides/${params.slug}` },
    };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/guides/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/guides/${post.slug}`,
    },
  };
}

export default function GuidePostPage({ params }: { params: { slug: string } }) {
  const post = getGuideBySlug(params.slug);
  if (!post) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-600">Not found.</p>
        <p className="mt-4">
          <Link href="/guides" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
            Back to Guides
          </Link>
        </p>
      </div>
    );
  }

  const lines = post.body.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5">
        {list.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );
    list = [];
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx] ?? "";
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(<h2 key={`h2-${idx}`}>{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    if (line.trim() === "") {
      flushList();
      continue;
    }
    flushList();
    blocks.push(<p key={`p-${idx}`}>{line}</p>);
  }
  flushList();

  const related = [...GUIDES]
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const a = new Set(post.keywords.map((k) => k.toLowerCase()));
      const b = new Set(p.keywords.map((k) => k.toLowerCase()));
      let score = 0;
      a.forEach((k) => {
        if (b.has(k)) score += 2;
      });
      const t = `${p.title} ${p.description}`.toLowerCase();
      post.keywords.forEach((k) => {
        if (t.includes(k.toLowerCase())) score += 1;
      });
      return { p, score };
    })
    .sort((x, y) => y.score - x.score || y.p.publishedAt.localeCompare(x.p.publishedAt))
    .slice(0, 3)
    .map((x) => x.p);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Script
        id="guide-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Guides", item: "/guides" },
              { "@type": "ListItem", position: 3, name: post.title, item: `/guides/${post.slug}` },
            ],
          }),
        }}
      />
      <header className="mb-6">
        <p className="text-xs text-slate-500">
          <Link href="/guides" className="hover:underline hover:underline-offset-2">
            Guides
          </Link>{" "}
          <span aria-hidden>·</span> {post.publishedAt}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{post.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.description}</p>
      </header>

      <article className="prose prose-slate max-w-none">{blocks}</article>

      <footer className="mt-10 border-t border-slate-200 pt-6">
        {related.length ? (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900">Related guides</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/guides/${encodeURIComponent(r.slug)}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm hover:border-slate-300 hover:shadow-md"
                >
                  <div className="font-semibold text-slate-900">{r.title}</div>
                  <div className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{r.description}</div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-sm text-slate-600">
          Next:{" "}
          <Link href="/pricing" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            See pricing
          </Link>{" "}
          or{" "}
          <Link href="/quote/new" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
            create a quote
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}

