"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Link from "next/link";
import QRCode from "qrcode";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionProvider";
import { TextButton } from "@/components/TextButton";
import { pushProjectDataToCloud } from "@/lib/cloudProjectData";
import { canvasGrayscaleForExport } from "@/lib/canvasGrayscale";
import { formatCurrency } from "@/lib/format";
import { readImageCompressedDataUrl } from "@/lib/imageUpload";
import type { QuoteSharePayload } from "@/lib/quoteSharePayload";
import { quoteHtml2canvasOnClone } from "@/lib/quotePrintHtml2Canvas";
import { quoteGrandTotal, quoteSubtotal, quoteTax } from "@/lib/quoteTotals";
import { encodeSharePayload } from "@/lib/share";
import { commitNextQuoteNo, dateToYmdCompact, peekNextQuoteNo } from "@/lib/quoteNumber";
import {
  getCompanies,
  getCustomers,
  getProducts,
  getQuotes,
  setCustomers,
  setProducts,
  setQuotes,
} from "@/lib/storage";
import type {
  Company,
  Customer,
  Product,
  Quote,
  QuoteExtraFee,
  QuoteLine,
} from "@/lib/types";

function todayIso(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function newLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random()}`;
}

function newProductCode(existing: Product[]): string {
  return `P${String(existing.length + 1).padStart(5, "0")}`;
}

function newCustomerCode(existing: Customer[]): string {
  return `C${String(existing.length + 1).padStart(5, "0")}`;
}

function calcLineAmount(price: number, qty: number): number {
  return Math.round(price * qty * 100) / 100;
}

const emptyQuickProduct: Omit<Product, "id"> = {
  code: "",
  name: "",
  model: "",
  spec: "",
  unit: "",
  price: 0,
  image: "",
};

const emptyQuickCustomer: Omit<Customer, "id"> = {
  code: "",
  name: "",
  contact: "",
  phone: "",
  address: "",
  mainBusiness: "",
  taxId: "",
  bankName: "",
  bankAccount: "",
};

type LineTextDraft = Record<string, { price?: string; qty?: string }>;

type ExtraFeeAmountDraft = Record<string, string>;
const QUOTE_TERMS_TEMPLATE_KEY = "quote_terms_template_v1";

function loadQuoteTermsTemplate(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUOTE_TERMS_TEMPLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveQuoteTermsTemplate(terms: string[]): void {
  if (typeof window === "undefined") return;
  const clean = terms.map((t) => t.trim()).filter(Boolean);
  localStorage.setItem(QUOTE_TERMS_TEMPLATE_KEY, JSON.stringify(clean));
}

function displayLinePrice(l: QuoteLine, draft: LineTextDraft): string {
  const v = draft[l.id]?.price;
  if (v !== undefined) return v;
  return l.price === 0 ? "" : String(l.price);
}

function displayLineQty(l: QuoteLine, draft: LineTextDraft): string {
  const v = draft[l.id]?.qty;
  if (v !== undefined) return v;
  return l.qty === 0 ? "" : String(l.qty);
}

function displayExtraFeeAmount(f: QuoteExtraFee, draft: ExtraFeeAmountDraft): string {
  const v = draft[f.id];
  if (v !== undefined) return v;
  return f.amount === 0 ? "" : String(f.amount);
}

function termsHasContent(terms: string[]): boolean {
  return terms.some((t) => t.trim().length > 0);
}

function quoteHasExtraFees(fees: QuoteExtraFee[]): boolean {
  return fees.length > 0;
}

export function QuoteEditor() {
  const subCtx = useSubscriptionAccess();
  const sp = useSearchParams();
  const router = useRouter();
  const quoteIdParam = sp.get("id");
  const shareParam = sp.get("share");

  const [companies, setCompaniesState] = useState<Company[]>([]);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);

  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [quoteNo, setQuoteNo] = useState("");
  const [date, setDate] = useState(todayIso);
  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustDrop, setShowCustDrop] = useState(false);

  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxRate, setTaxRate] = useState(13);
  const [extraFees, setExtraFees] = useState<QuoteExtraFee[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [showLineImages, setShowLineImages] = useState(true);
  const [lineTextDraft, setLineTextDraft] = useState<LineTextDraft>({});
  const [extraFeeAmountDraft, setExtraFeeAmountDraft] = useState<ExtraFeeAmountDraft>({});

  const [pickerOpen, setPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(emptyQuickProduct);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState(emptyQuickCustomer);
  const [suppressAutoQuoteNo, setSuppressAutoQuoteNo] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareQr, setShareQr] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [saveHint, setSaveHint] = useState("");
  /** 用户改过单号后，不再用我司/日期自动覆盖预览单号；切换我司或日期会解除 */
  const [quoteNoLocked, setQuoteNoLocked] = useState(false);
  /** 导出图片/PDF：勾选为彩色，不勾选为黑白（默认黑白） */
  const [exportInColor, setExportInColor] = useState(false);

  const refreshStores = useCallback(() => {
    setCompaniesState(getCompanies());
    setCustomersState(getCustomers());
    setProductsState(getProducts());
  }, []);

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );
  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );

  const abbr = (company?.abbr ?? "NA").toUpperCase();
  const ymdCompact = dateToYmdCompact(date);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = () => {
      let shareEnc: string | null = shareParam;
      if (shareEnc) {
        try {
          shareEnc = decodeURIComponent(shareEnc);
        } catch {
          /* 保持原样 */
        }
      }

      if (!shareEnc && typeof window !== "undefined") {
        const h = window.location.hash;
        if (h.startsWith("#share=")) {
          shareEnc = h.slice(7);
          try {
            shareEnc = decodeURIComponent(shareEnc);
          } catch {
            /* 保持原样 */
          }
        }
      }

      if (quoteIdParam) {
        const q = getQuotes().find((x) => x.id === quoteIdParam);
        if (q) {
          if (!cancelled) {
            setQuoteId(q.id);
            setIsDraft(false);
            setSuppressAutoQuoteNo(false);
            setQuoteNo(q.quoteNo);
            setDate(q.date);
            setCompanyId(q.companyId);
            setCustomerId(q.customerId);
            setCustomerQuery("");
            setLines(q.lines);
            setTaxIncluded(q.taxIncluded);
            setTaxRate(q.taxRate);
            setExtraFees(q.extraFees);
            setTerms(Array.isArray(q.terms) ? q.terms : []);
            setLineTextDraft({});
            setExtraFeeAmountDraft({});
            setQuoteNoLocked(false);
          }
          return;
        }
      }

      if (shareEnc && !quoteIdParam) {
        router.replace(`/quote/preview?share=${encodeURIComponent(shareEnc)}`);
        return;
      }

      if (cancelled) return;
      const comps = getCompanies();
      const def = comps.find((c) => c.isDefault) ?? comps[0];
      setQuoteId(null);
      setIsDraft(true);
      setSuppressAutoQuoteNo(false);
      setDate(todayIso());
      setCompanyId(def?.id ?? "");
      setCustomerId("");
      setCustomerQuery("");
      setLines([]);
      setTaxIncluded(false);
      setTaxRate(13);
      setExtraFees([]);
      setTerms(loadQuoteTermsTemplate());
      setLineTextDraft({});
      setExtraFeeAmountDraft({});
      setQuoteNoLocked(false);
      const a = (def?.abbr ?? "NA").toUpperCase();
      const d = dateToYmdCompact(todayIso());
      setQuoteNo(peekNextQuoteNo(a, d));
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [quoteIdParam, shareParam, router]);

  useEffect(() => {
    if (!isDraft || suppressAutoQuoteNo || quoteNoLocked) return;
    if (!companyId || !company) return;
    setQuoteNo(peekNextQuoteNo(abbr, ymdCompact));
  }, [isDraft, suppressAutoQuoteNo, quoteNoLocked, companyId, date, abbr, ymdCompact, company]);

  const custFiltered = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.contact.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [customers, customerQuery]);

  const productsFiltered = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.spec.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const subtotal = quoteSubtotal(lines);
  const taxAmt = quoteTax(subtotal, taxIncluded, taxRate);
  const grand = quoteGrandTotal(lines, taxIncluded, taxRate, extraFees);

  function addProductLine(p: Product) {
    const price = p.price;
    const qty = 1;
    const line: QuoteLine = {
      id: newLineId(),
      productId: p.id,
      code: p.code,
      name: p.name,
      model: p.model,
      spec: p.spec,
      unit: p.unit,
      price,
      qty,
      amount: calcLineAmount(price, qty),
      image: p.image,
      remark: "",
    };
    setLines((prev) => [...prev, line]);
    setPickerOpen(false);
    setProductSearch("");
  }

  function updateLine(id: string, patch: Partial<Pick<QuoteLine, "price" | "qty" | "remark">>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const price = patch.price ?? l.price;
        const qty = patch.qty ?? l.qty;
        const remark = patch.remark !== undefined ? patch.remark : l.remark;
        return { ...l, price, qty, remark, amount: calcLineAmount(price, qty) };
      })
    );
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setLineTextDraft((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }

  function setLinePriceInput(id: string, raw: string) {
    if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setLineTextDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], price: raw },
    }));
    const n = raw === "" || raw === "." || raw === "-" ? 0 : Number.parseFloat(raw);
    updateLine(id, { price: Number.isFinite(n) ? n : 0 });
  }

  function setLineQtyInput(id: string, raw: string) {
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setLineTextDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], qty: raw },
    }));
    const n = raw === "" || raw === "." ? 0 : Number.parseFloat(raw);
    updateLine(id, { qty: Number.isFinite(n) ? n : 0 });
  }

  function addTerm() {
    setTerms((prev) => [...prev, ""]);
  }

  function updateTerm(index: number, text: string) {
    setTerms((prev) => prev.map((t, i) => (i === index ? text : t)));
  }

  function removeTerm(index: number) {
    setTerms((prev) => prev.filter((_, i) => i !== index));
  }

  function addExtraFee() {
    setExtraFees((prev) => [
      ...prev,
      { id: newLineId(), name: "其他费用", amount: 0 },
    ]);
  }

  function updateExtraFee(id: string, patch: Partial<QuoteExtraFee>) {
    setExtraFees((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeExtraFee(id: string) {
    setExtraFees((prev) => prev.filter((f) => f.id !== id));
    setExtraFeeAmountDraft((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }

  function setExtraFeeAmountInput(id: string, raw: string) {
    if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setExtraFeeAmountDraft((prev) => ({ ...prev, [id]: raw }));
    const n = raw === "" || raw === "." || raw === "-" ? 0 : Number.parseFloat(raw);
    updateExtraFee(id, { amount: Number.isFinite(n) ? n : 0 });
  }

  async function saveQuote() {
    if (!companyId) {
      alert("请先在我司信息中维护公司主体并选择");
      return;
    }
    if (!customerId) {
      alert("请选择客户或快速新建客户");
      return;
    }
    if (lines.length === 0) {
      alert("请至少添加一条商品明细");
      return;
    }
    const now = new Date().toISOString();
    const all = getQuotes();
    let finalNo = quoteNo;
    let id = quoteId;

    if (isDraft || !quoteId) {
      const trimmedNo = quoteNo.trim();
      const previewNo = peekNextQuoteNo(abbr, ymdCompact);
      finalNo = !trimmedNo || trimmedNo === previewNo ? commitNextQuoteNo(abbr, ymdCompact) : trimmedNo;
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `q-${Date.now()}`;
      const created: Quote = {
        id: id!,
        quoteNo: finalNo,
        date,
        companyId,
        customerId,
        lines,
        taxIncluded,
        taxRate,
        extraFees,
        terms,
        createdAt: now,
        updatedAt: now,
      };
      setQuotes([...all, created]);
      setQuoteId(id);
      setQuoteNo(finalNo);
      setIsDraft(false);
    } else {
      const next = all.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              quoteNo,
              date,
              companyId,
              customerId,
              lines,
              taxIncluded,
              taxRate,
              extraFees,
              terms,
              updatedAt: now,
            }
          : q
      );
      setQuotes(next);
    }
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) {
        setSaveHint(`报价已保存本地，但云端同步失败：${sync.error}`);
        return;
      }
    }
    refreshStores();
    setSaveHint(`报价已保存（本地浏览器） ${new Date().toLocaleTimeString()}`);
  }

  async function exportImage() {
    const el = document.getElementById("quote-print");
    if (!el) return;
    let canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1280,
      windowHeight: Math.max(el.scrollHeight, 1600),
      onclone: (clonedDoc) =>
        quoteHtml2canvasOnClone(clonedDoc, {
          hasTermsContent: termsHasContent(terms),
          hasExtraFees: quoteHasExtraFees(extraFees),
        }),
    });
    if (!exportInColor) {
      canvas = canvasGrayscaleForExport(canvas);
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png", 1.0);
    a.download = `${quoteNo || "quote"}.png`;
    a.click();
  }

  async function exportPdf() {
    const el = document.getElementById("quote-print");
    if (!el) return;
    let canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1280,
      windowHeight: Math.max(el.scrollHeight, 1600),
      onclone: (clonedDoc) =>
        quoteHtml2canvasOnClone(clonedDoc, {
          hasTermsContent: termsHasContent(terms),
          hasExtraFees: quoteHasExtraFees(extraFees),
        }),
    });
    if (!exportInColor) {
      canvas = canvasGrayscaleForExport(canvas);
    }
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    let remaining = imgH;
    pdf.addImage(img, "PNG", 0, y, imgW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      y -= pageH;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, y, imgW, imgH);
      remaining -= pageH;
    }
    pdf.save(`${quoteNo || "quote"}.pdf`);
  }

  async function openShareModal() {
    if (!companyId) {
      alert("请先选择我司主体");
      return;
    }
    setShareOpen(true);
    setShareLoading(true);
    setShareError("");
    setShareUrl("");
    setShareQr("");
    try {
      const payload: QuoteSharePayload = {
        type: "quote",
        quoteNo,
        date,
        companyId,
        customerId,
        companySnapshot: company
          ? {
              name: company.name,
              contact: company.contact,
              phone: company.phone,
              address: company.address,
              logo: undefined,
              taxId: company.taxId,
              bankName: company.bankName,
              bankCode: company.bankCode,
              abbr: company.abbr,
            }
          : null,
        customerSnapshot: customer
          ? {
              name: customer.name,
              contact: customer.contact,
              phone: customer.phone,
              address: customer.address,
            }
          : null,
        // 分享链接需要尽量短：不携带行内 base64 图片，避免超长 URL。
        lines: lines.map((l) => ({ ...l, image: undefined })),
        taxIncluded,
        taxRate,
        extraFees,
        terms,
      };
      const enc = await encodeSharePayload(payload);
      const base =
        typeof window !== "undefined" ? `${window.location.origin}/quote/preview` : "";
      const url = `${base}?share=${encodeURIComponent(enc)}`;
      if (url.length > 32000) {
        setShareError("报价数据过大。分享已自动隐藏图片，如仍过大请减少明细，或改用生成图片/PDF。");
        return;
      }
      setShareUrl(url);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffffff" },
      });
      setShareQr(dataUrl);
    } catch {
      setShareError("生成分享链接或二维码失败，请稍后重试。");
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl).then(
      () => alert("链接已复制到剪贴板"),
      () => {
        window.prompt("请手动复制以下链接", shareUrl);
      }
    );
  }

  function downloadShareQr() {
    if (!shareQr) return;
    const a = document.createElement("a");
    a.href = shareQr;
    a.download = `报价分享-${quoteNo || "二维码"}.png`;
    a.click();
  }

  function closeShareModal() {
    setShareOpen(false);
    setShareError("");
    setShareUrl("");
    setShareQr("");
  }

  async function saveQuickProduct() {
    const rows = getProducts();
    if (!quickProduct.code.trim() || !quickProduct.name.trim()) {
      alert("请填写商品编码与名称");
      return;
    }
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `pid-${Date.now()}`;
    const p: Product = {
      id,
      ...quickProduct,
      price: Number(quickProduct.price) || 0,
      image: quickProduct.image || undefined,
    };
    setProducts([...rows, p]);
    setProductsState([...rows, p]);
    setQuickProductOpen(false);
    setQuickProduct({ ...emptyQuickProduct, code: newProductCode([...rows, p]) });
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`商品已保存本地，但同步云端失败：${sync.error}`);
    }
    refreshStores();
  }

  async function saveQuickCustomer() {
    const rows = getCustomers();
    if (!quickCustomer.name.trim()) {
      alert("请填写客户名称");
      return;
    }
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cid-${Date.now()}`;
    const c: Customer = {
      id,
      ...quickCustomer,
      code: quickCustomer.code.trim() || newCustomerCode(rows),
    };
    setCustomers([...rows, c]);
    setCustomersState([...rows, c]);
    setCustomerId(id);
    setCustomerQuery(c.name);
    setQuickCustomerOpen(false);
    setQuickCustomer(emptyQuickCustomer);
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`客户已保存本地，但同步云端失败：${sync.error}`);
    }
    refreshStores();
  }

  function openQuickProduct() {
    setQuickProduct({ ...emptyQuickProduct, code: newProductCode(getProducts()) });
    setQuickProductOpen(true);
  }

  async function onQuickProductImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const compressed = await readImageCompressedDataUrl(f, { maxSide: 1200, quality: 0.8 });
      setQuickProduct((s) => ({ ...s, image: compressed }));
    } catch {
      alert("图片处理失败，请换一张图片重试");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <PageHeader
        title="新建报价"
        actions={
          <Link href="/quote">
            <TextButton variant="secondary">查询报价</TextButton>
          </Link>
        }
      />

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={showLineImages}
          onChange={(e) => setShowLineImages(e.target.checked)}
        />
        显示明细商品图片（取消勾选则隐藏图片列；导出图片与 PDF 时同样生效）
      </label>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        提示：报价单号按“每天从 001 开始、每保存一次递增”。未保存前预览号可能保持不变，保存后才会占用并跳到下一个编号。
      </p>

      <div
        id="quote-print"
        className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-16 shrink-0 sm:w-24" aria-hidden />
            <h2 className="min-w-0 flex-1 pt-1 text-center text-xl font-semibold tracking-wide text-slate-900">
              报价单
            </h2>
            <div className="quote-print-logo-cell flex h-16 w-20 shrink-0 items-start justify-end sm:h-20 sm:w-28">
              {company?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo}
                  alt=""
                  className="quote-print-logo max-h-16 max-w-full object-contain object-top sm:max-h-20"
                />
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500" htmlFor="quote-no-input">
                报价单号：
                <span className="quote-no-print">（可修改）</span>
              </label>
              <input
                id="quote-no-input"
                type="text"
                className="mt-1 w-full min-h-11 rounded border border-slate-300 px-3 py-2.5 text-sm font-medium leading-normal text-slate-900"
                value={quoteNo}
                onChange={(e) => {
                  setQuoteNoLocked(true);
                  setQuoteNo(e.target.value);
                }}
                placeholder="自动生成，可直接修改"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">报价日期：</label>
              <input
                type="date"
                className="mt-1 w-full min-h-11 rounded border border-slate-300 px-3 py-2.5 text-sm leading-normal"
                value={date}
                onChange={(e) => {
                  setSuppressAutoQuoteNo(false);
                  setQuoteNoLocked(false);
                  setDate(e.target.value);
                }}
              />
            </div>
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <label className="text-xs font-medium text-slate-600">供方名称</label>
                <select
                  className="mt-1 w-full min-h-11 rounded border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal"
                  value={companyId}
                  title={
                    company
                      ? `${company.name} (${company.abbr})`
                      : companies.find((c) => c.id === companyId)?.name ?? ""
                  }
                  onChange={(e) => {
                    setSuppressAutoQuoteNo(false);
                    setQuoteNoLocked(false);
                    setCompanyId(e.target.value);
                  }}
                >
                  <option value="">请选择供方</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.abbr})
                    </option>
                  ))}
                </select>
                {company ? (
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                    <div>
                      <span className="text-slate-500">联系人：</span>
                      {company.contact || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">联系电话：</span>
                      {company.phone || "—"}
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">地址：</span>
                      {company.address || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">请选择供方后显示联系方式与地址</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                <label className="text-xs font-medium text-slate-600">客户名称</label>
                <div className="quote-no-print mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="relative min-w-0 flex-1">
                    <input
                      className="w-full min-h-11 rounded border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal"
                      placeholder="输入搜索客户"
                      value={customerQuery}
                      onFocus={() => setShowCustDrop(true)}
                      onChange={(e) => {
                        setCustomerQuery(e.target.value);
                        setShowCustDrop(true);
                      }}
                    />
                    {showCustDrop && custFiltered.length > 0 ? (
                      <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded border border-slate-200 bg-white shadow-md">
                        {custFiltered.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustomerQuery(c.name);
                              setShowCustDrop(false);
                            }}
                          >
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-slate-500">
                              {c.contact} {c.phone}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <TextButton
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setQuickCustomerOpen(true)}
                  >
                    快速新建客户
                  </TextButton>
                </div>
                {customer ? (
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-800">
                    <div className="text-base font-semibold text-slate-900">{customer.name}</div>
                    <div>
                      <span className="text-slate-500">联系人：</span>
                      {customer.contact || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">联系电话：</span>
                      {customer.phone || "—"}
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">地址：</span>
                      {customer.address || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="quote-no-print mt-2 text-xs text-slate-500">
                    请搜索并选择客户，或快速新建
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TextButton
              variant="primary"
              className="quote-no-print"
              onClick={() => setPickerOpen(true)}
            >
              添加商品
            </TextButton>
          </div>

          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900">【报价明细】</h3>

          <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
            <table className="quote-table w-full min-w-[960px] border-collapse text-center text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {showLineImages ? (
                    <th className="border border-slate-200 px-2 py-2.5 font-medium">图</th>
                  ) : null}
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">名称</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">型号</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">规格</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">单位</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">单价</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">数量</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">金额</th>
                  <th className="min-w-[8rem] border border-slate-200 px-2 py-2.5 font-medium">
                    备注
                  </th>
                  <th className="quote-no-print border border-slate-200 px-2 py-2.5 font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="align-top">
                    {showLineImages ? (
                      <td className="border border-slate-200 px-2 py-2 text-center">
                        {l.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.image} alt="" className="mx-auto h-12 w-12 rounded object-cover" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                      {l.name}
                    </td>
                    <td className="max-w-[8rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                      {l.model}
                    </td>
                    <td className="max-w-[10rem] whitespace-normal break-words border border-slate-200 px-2 py-2 align-top text-center leading-relaxed">
                      {l.spec}
                    </td>
                    <td className="whitespace-normal border border-slate-200 px-2 py-2 align-top text-center">
                      {l.unit}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 align-top text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        className="mx-auto box-border w-24 min-h-9 rounded border border-slate-300 px-2 py-2 text-center text-sm leading-normal"
                        value={displayLinePrice(l, lineTextDraft)}
                        onChange={(e) => setLinePriceInput(l.id, e.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-2 align-top text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        className="mx-auto box-border w-20 min-h-9 rounded border border-slate-300 px-2 py-2 text-center text-sm leading-normal"
                        value={displayLineQty(l, lineTextDraft)}
                        onChange={(e) => setLineQtyInput(l.id, e.target.value)}
                      />
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-2 py-2 align-top text-center">
                      {formatCurrency(l.amount)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 align-top text-center">
                      <textarea
                        rows={2}
                        className="mx-auto box-border w-full min-w-[7rem] resize-y rounded border border-slate-300 px-2 py-2 text-center text-sm leading-relaxed"
                        placeholder="备注"
                        value={l.remark ?? ""}
                        onChange={(e) => updateLine(l.id, { remark: e.target.value })}
                      />
                    </td>
                    <td className="quote-no-print border border-slate-200 px-2 py-2 align-top">
                      <TextButton
                        variant="ghost"
                        className="!px-0 text-red-700"
                        onClick={() => removeLine(l.id)}
                      >
                        删除
                      </TextButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lines.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">暂无明细，请点击添加商品</p>
            ) : null}
          </div>

          <div className="quote-print-lines-mobile space-y-3 md:hidden">
            {lines.map((l) => (
              <div key={l.id} className="rounded border border-slate-200 p-3 text-sm">
                <div className="flex gap-2">
                  {showLineImages && l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{l.name}</div>
                    <div className="break-words text-slate-600">
                      {l.model} / {l.spec}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className="text-xs text-slate-500">
                        单价
                        <input
                          type="text"
                          inputMode="decimal"
                          className="ml-1 box-border w-24 min-h-9 rounded border border-slate-300 px-2 py-2 text-sm leading-normal"
                          value={displayLinePrice(l, lineTextDraft)}
                          onChange={(e) => setLinePriceInput(l.id, e.target.value)}
                        />
                      </label>
                      <label className="text-xs text-slate-500">
                        数量
                        <input
                          type="text"
                          inputMode="decimal"
                          className="ml-1 box-border w-20 min-h-9 rounded border border-slate-300 px-2 py-2 text-sm leading-normal"
                          value={displayLineQty(l, lineTextDraft)}
                          onChange={(e) => setLineQtyInput(l.id, e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="mt-2 block text-xs text-slate-500">
                      备注
                      <textarea
                        rows={2}
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-2 text-sm leading-relaxed"
                        value={l.remark ?? ""}
                        onChange={(e) => updateLine(l.id, { remark: e.target.value })}
                      />
                    </label>
                    <div className="mt-1 font-medium">金额 {formatCurrency(l.amount)}</div>
                    <TextButton
                      variant="ghost"
                      className="quote-no-print mt-2 !px-0 text-red-700"
                      onClick={() => removeLine(l.id)}
                    >
                      删除
                    </TextButton>
                  </div>
                </div>
              </div>
            ))}
            {lines.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">暂无明细</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={taxIncluded}
                onChange={(e) => setTaxIncluded(e.target.checked)}
              />
              含税
            </label>
            {taxIncluded ? (
              <label className="flex items-center gap-2">
                税率（%）
                <input
                  type="number"
                  step="0.01"
                  className="min-h-9 w-24 rounded border border-slate-300 px-2 py-2 leading-normal"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                />
              </label>
            ) : null}
          </div>
          <div id="quote-export-extra-fees-fields" className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">其他费用</span>
              <TextButton variant="secondary" className="quote-no-print" onClick={addExtraFee}>
                添加费用行
              </TextButton>
            </div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex w-full flex-wrap items-center gap-2">
                <input
                  className="min-h-9 flex-1 rounded border border-slate-300 px-2 py-2 text-sm leading-normal"
                  value={f.name}
                  onChange={(e) => updateExtraFee(f.id, { name: e.target.value })}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className="ml-auto min-h-9 w-28 rounded border border-slate-300 px-2 py-2 text-right text-sm leading-normal"
                  value={displayExtraFeeAmount(f, extraFeeAmountDraft)}
                  onChange={(e) => setExtraFeeAmountInput(f.id, e.target.value)}
                />
                <TextButton
                  variant="ghost"
                  className="quote-no-print !px-0 text-red-700"
                  onClick={() => removeExtraFee(f.id)}
                >
                  删除
                </TextButton>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>商品合计</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxIncluded ? (
              <div className="flex justify-between text-slate-700">
                <span>税额</span>
                <span>{formatCurrency(taxAmt)}</span>
              </div>
            ) : null}
            <div
              id="quote-export-extra-fees-total-row"
              className="flex justify-between text-slate-700"
            >
              <span>其他费用合计</span>
              <span>{formatCurrency(extraFees.reduce((s, f) => s + f.amount, 0))}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold text-slate-900">
              <span>总价</span>
              <span>{formatCurrency(grand)}</span>
            </div>
          </div>
        </div>

        <div id="quote-terms-section" className="mt-8 border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">报价条款</h3>
            <div className="quote-no-print flex flex-wrap gap-2">
              <TextButton
                variant="secondary"
                onClick={() => {
                  saveQuoteTermsTemplate(terms);
                  alert("已保存为默认条款，下次新建报价自动带入。");
                }}
              >
                保存为默认条款
              </TextButton>
              <TextButton variant="secondary" onClick={addTerm}>
                添加条款
              </TextButton>
            </div>
          </div>
          {terms.length === 0 ? (
            <p className="quote-no-print text-sm text-slate-500">
              暂无条款，可点击「添加条款」增加一条或多条说明。
            </p>
          ) : (
            <div className="space-y-3 text-sm text-slate-800">
              {terms.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 pt-2 text-right font-medium">{i + 1}.</div>
                  <div className="flex-1">
                    <textarea
                      rows={3}
                      className="min-h-[4rem] flex-1 rounded border border-slate-300 px-3 py-2 leading-relaxed"
                      value={t}
                      onChange={(e) => updateTerm(i, e.target.value)}
                      placeholder={`第 ${i + 1} 条条款内容`}
                    />
                  </div>
                    <TextButton
                      variant="ghost"
                      className="quote-no-print h-fit shrink-0 text-red-700"
                      onClick={() => removeTerm(i)}
                    >
                      删除
                    </TextButton>
                  </div>
              ))}
            </div>
          )}
        </div>

        {company && (company.taxId || company.bankName) ? (
          <div className="mt-10 border-t-2 border-slate-300 pt-6 text-sm leading-relaxed text-slate-700">
            <div className="mb-2 text-xs font-medium text-slate-500">供方账户信息</div>
            {company.taxId ? (
              <div className="whitespace-pre-wrap break-words">税号：{company.taxId}</div>
            ) : null}
            {company.bankName ? (
              <div className="whitespace-pre-wrap break-words">
                开户行：{company.bankName}
                {company.bankCode ? `　银行卡号：${company.bankCode}` : ""}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {saveHint ? <p className="text-sm text-emerald-700">{saveHint}</p> : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={exportInColor}
            onChange={(e) => setExportInColor(e.target.checked)}
          />
          导出为彩色（生成图片 / PDF；不勾选则为黑白样式，默认黑白）
        </label>
        <div className="flex flex-wrap gap-2">
        <TextButton variant="primary" onClick={saveQuote}>
          保存报价
        </TextButton>
        <TextButton variant="secondary" onClick={() => void openShareModal()}>
          分享报价
        </TextButton>
        <TextButton variant="secondary" onClick={() => void exportImage()}>
          生成图片
        </TextButton>
        <TextButton variant="secondary" onClick={() => void exportPdf()}>
          生成PDF
        </TextButton>
        <Link href="/quote">
          <TextButton variant="secondary">查询报价</TextButton>
        </Link>
        </div>
      </div>

      <Modal
        open={shareOpen}
        title="分享报价"
        onClose={closeShareModal}
        panelClassName="max-w-xl"
        footer={
          <>
            <TextButton variant="secondary" onClick={closeShareModal}>
              关闭
            </TextButton>
            <TextButton variant="primary" disabled={!shareUrl} onClick={copyShareUrl}>
              复制链接
            </TextButton>
            <TextButton variant="secondary" disabled={!shareQr} onClick={downloadShareQr}>
              下载二维码
            </TextButton>
          </>
        }
      >
        {shareLoading ? (
          <p className="text-center text-sm text-slate-600">正在生成链接与二维码…</p>
        ) : null}
        {shareError ? <p className="text-sm text-red-600">{shareError}</p> : null}
        {shareUrl && !shareError ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600">
              将下方链接或二维码发给对方，打开后为只读预览图（与默认导出图片样式一致）。为避免内存占用过大，分享会自动隐藏商品图片，仅分享文字和金额；需要带图请使用「生成图片」或「生成PDF」。
            </p>
            <div>
              <label className="block text-xs text-slate-500">分享链接</label>
              <input
                readOnly
                className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800"
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
            </div>
            {shareQr ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500">扫码打开</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shareQr} alt="报价分享二维码" className="h-56 w-56 rounded border border-slate-200 bg-white p-2" />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={pickerOpen}
        title="选择商品"
        onClose={() => setPickerOpen(false)}
        footer={
          <TextButton variant="secondary" onClick={() => setPickerOpen(false)}>
            关闭
          </TextButton>
        }
      >
        <div className="mb-3">
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="搜索商品"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>
        <TextButton variant="secondary" className="mb-3" onClick={openQuickProduct}>
          快速登记新商品
        </TextButton>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {productsFiltered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full rounded border border-slate-100 px-2 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => addProductLine(p)}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-slate-500">
                {p.code} · {formatCurrency(p.price)} / {p.unit}
              </div>
            </button>
          ))}
        </div>
        {productsFiltered.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-500">无匹配商品</p>
        ) : null}
      </Modal>

      <Modal
        open={quickProductOpen}
        title="快速登记新商品"
        onClose={() => setQuickProductOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setQuickProductOpen(false)}>
              取消
            </TextButton>
            <TextButton variant="primary" onClick={saveQuickProduct}>
              保存并回到列表
            </TextButton>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="编码"
            value={quickProduct.code}
            onChange={(e) => setQuickProduct((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="名称"
            value={quickProduct.name}
            onChange={(e) => setQuickProduct((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="型号"
            value={quickProduct.model}
            onChange={(e) => setQuickProduct((s) => ({ ...s, model: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="规格"
            value={quickProduct.spec}
            onChange={(e) => setQuickProduct((s) => ({ ...s, spec: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="单位"
            value={quickProduct.unit}
            onChange={(e) => setQuickProduct((s) => ({ ...s, unit: e.target.value }))}
          />
          <input
            type="number"
            step="0.01"
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="单价"
            value={quickProduct.price || ""}
            onChange={(e) =>
              setQuickProduct((s) => ({ ...s, price: Number.parseFloat(e.target.value) || 0 }))
            }
          />
          <input type="file" accept="image/*" onChange={onQuickProductImage} />
        </div>
      </Modal>

      <Modal
        open={quickCustomerOpen}
        title="快速新建客户"
        onClose={() => setQuickCustomerOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setQuickCustomerOpen(false)}>
              取消
            </TextButton>
            <TextButton variant="primary" onClick={saveQuickCustomer}>
              保存并选中
            </TextButton>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="客户名称"
            value={quickCustomer.name}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="联系人"
            value={quickCustomer.contact}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, contact: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="电话"
            value={quickCustomer.phone}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, phone: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="地址（可选）"
            value={quickCustomer.address}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, address: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
