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
import { compositeSealsInColorOnCanvasAsync } from "@/lib/contractExportSeal";
import { formatMoney, normalizeDocumentCurrency } from "@/lib/format";
import { readImageCompressedDataUrl } from "@/lib/imageUpload";
import type { QuoteSharePayload } from "@/lib/quoteSharePayload";
import { quoteHtml2canvasOnClone } from "@/lib/quotePrintHtml2Canvas";
import { quoteGrandTotal, quoteSubtotal, quoteTax } from "@/lib/quoteTotals";
import { encodeSharePayload } from "@/lib/share";
import { quoteDisplayStatus, toBaseQuoteStatus, type QuoteStatusBase } from "@/lib/quoteStatus";
import { commitNextQuoteNo, dateToYmdCompact, peekNextQuoteNo } from "@/lib/quoteNumber";
import {
  getCompanies,
  getCustomers,
  markQuoteStatusById,
  getProducts,
  getQuotes,
  getSettings,
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

function isoAfterDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
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
const QUOTE_EDITOR_AUTOSAVE_KEY = "quote_editor_autosave_v1";

interface QuoteEditorAutosave {
  savedAt: string;
  quoteNo: string;
  date: string;
  validUntil: string;
  paymentTerms: string;
  status: QuoteStatusBase;
  paymentLink: string;
  paidAt: string;
  companyId: string;
  customerId: string;
  customerQuery: string;
  lines: QuoteLine[];
  taxIncluded: boolean;
  taxRate: number;
  currency: string;
  extraFees: QuoteExtraFee[];
  terms: string[];
  showSeal: boolean;
}

function loadQuoteEditorAutosave(): QuoteEditorAutosave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(QUOTE_EDITOR_AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuoteEditorAutosave;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveQuoteEditorAutosave(payload: QuoteEditorAutosave): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUOTE_EDITOR_AUTOSAVE_KEY, JSON.stringify(payload));
}

function clearQuoteEditorAutosave(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUOTE_EDITOR_AUTOSAVE_KEY);
}

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
  const [validUntil, setValidUntil] = useState(() => isoAfterDays(14));
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [status, setStatus] = useState<QuoteStatusBase>("draft");
  const [paymentLink, setPaymentLink] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustDrop, setShowCustDrop] = useState(false);

  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [extraFees, setExtraFees] = useState<QuoteExtraFee[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [showLineImages, setShowLineImages] = useState(true);
  /** Overlay company seal on quote (same scale as contract) */
  const [showSeal, setShowSeal] = useState(false);
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
  const [formError, setFormError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [autosaveAvailableAt, setAutosaveAvailableAt] = useState("");
  /** After manual quote-no edit, stop auto preview override; reset when company/date changes */
  const [quoteNoLocked, setQuoteNoLocked] = useState(false);
  /** Export image/PDF: checked=color, unchecked=grayscale (default grayscale) */
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

  const docCurrency = useMemo(() => normalizeDocumentCurrency(currency), [currency]);

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
          /* leave raw */
        }
      }

      if (!shareEnc && typeof window !== "undefined") {
        const h = window.location.hash;
        if (h.startsWith("#share=")) {
          shareEnc = h.slice(7);
          try {
            shareEnc = decodeURIComponent(shareEnc);
          } catch {
            /* leave raw */
          }
        }
      }

      if (quoteIdParam) {
        const q = getQuotes().find((x) => x.id === quoteIdParam);
        if (q) {
          if (!cancelled) {
            clearQuoteEditorAutosave();
            setAutosaveAvailableAt("");
            setQuoteId(q.id);
            setIsDraft(false);
            setSuppressAutoQuoteNo(false);
            setQuoteNo(q.quoteNo);
            setDate(q.date);
            setValidUntil(q.validUntil ?? isoAfterDays(14));
            setPaymentTerms(q.paymentTerms ?? "Net 30");
            setStatus(toBaseQuoteStatus(q.status));
            setPaymentLink(q.paymentLink ?? "");
            setPaidAt(q.paidAt ?? "");
            setCompanyId(q.companyId);
            setCustomerId(q.customerId);
            setCustomerQuery("");
            setLines(q.lines);
            setTaxIncluded(q.taxIncluded);
            setTaxRate(typeof q.taxRate === "number" ? q.taxRate : 0);
            setCurrency(q.currency ?? getSettings().documentCurrency);
            setExtraFees(q.extraFees);
            setTerms(Array.isArray(q.terms) ? q.terms : []);
            setShowSeal(q.showSeal === true);
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
      setValidUntil(isoAfterDays(14));
      setPaymentTerms("Net 30");
      setStatus("draft");
      setPaymentLink("");
      setPaidAt("");
      setCompanyId(def?.id ?? "");
      setCustomerId("");
      setCustomerQuery("");
      setLines([]);
      setTaxIncluded(false);
      setTaxRate(0);
      setCurrency(getSettings().documentCurrency);
      setExtraFees([]);
      setTerms(loadQuoteTermsTemplate());
      setShowSeal(false);
      setLineTextDraft({});
      setExtraFeeAmountDraft({});
      setQuoteNoLocked(false);
      const a = (def?.abbr ?? "NA").toUpperCase();
      const d = dateToYmdCompact(todayIso());
      setQuoteNo(peekNextQuoteNo(a, d));
      const autosave = loadQuoteEditorAutosave();
      setAutosaveAvailableAt(autosave?.savedAt ?? "");
    };

    void bootstrap();
    setBootstrapped(true);
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

  useEffect(() => {
    if (!bootstrapped) return;
    if (quoteIdParam || quoteId || shareParam) return;
    const timer = window.setTimeout(() => {
      const payload: QuoteEditorAutosave = {
        savedAt: new Date().toISOString(),
        quoteNo,
        date,
        validUntil,
        paymentTerms,
        status,
        paymentLink,
        paidAt,
        companyId,
        customerId,
        customerQuery,
        lines,
        taxIncluded,
        taxRate,
        currency,
        extraFees,
        terms,
        showSeal,
      };
      saveQuoteEditorAutosave(payload);
      setAutosaveAvailableAt(payload.savedAt);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [
    bootstrapped,
    quoteIdParam,
    quoteId,
    shareParam,
    quoteNo,
    date,
    validUntil,
    paymentTerms,
    status,
    paymentLink,
    paidAt,
    companyId,
    customerId,
    customerQuery,
    lines,
    taxIncluded,
    taxRate,
    currency,
    extraFees,
    terms,
    showSeal,
  ]);

  function restoreAutosave() {
    const draft = loadQuoteEditorAutosave();
    if (!draft) return;
    setQuoteNo(draft.quoteNo);
    setDate(draft.date);
    setValidUntil(draft.validUntil);
    setPaymentTerms(draft.paymentTerms);
    setStatus(draft.status);
    setPaymentLink(draft.paymentLink);
    setPaidAt(draft.paidAt);
    setCompanyId(draft.companyId);
    setCustomerId(draft.customerId);
    setCustomerQuery(draft.customerQuery);
    setLines(draft.lines);
    setTaxIncluded(draft.taxIncluded);
    setTaxRate(draft.taxRate);
    setCurrency(draft.currency);
    setExtraFees(draft.extraFees);
    setTerms(draft.terms);
    setShowSeal(draft.showSeal);
    setLineTextDraft({});
    setExtraFeeAmountDraft({});
    setSaveHint(`Restored local draft from ${new Date(draft.savedAt).toLocaleString()}`);
  }

  function dismissAutosave() {
    clearQuoteEditorAutosave();
    setAutosaveAvailableAt("");
  }

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
      { id: newLineId(), name: "Additional fee", amount: 0 },
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
    setFormError("");
    if (!companyId) {
      setFormError("Please select a seller (your company).");
      document.getElementById("quote-seller-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!customerId) {
      setFormError("Please select or add a customer.");
      document.getElementById("quote-customer-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (lines.length === 0) {
      setFormError("Please add at least one line item.");
      document.getElementById("quote-lines-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        showSeal: showSeal === true,
        validUntil,
        paymentTerms: paymentTerms.trim(),
        status,
        paymentLink: paymentLink.trim() || undefined,
        paidAt: paidAt || undefined,
        currency: docCurrency,
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
              showSeal: showSeal === true,
              validUntil,
              paymentTerms: paymentTerms.trim(),
              status,
              paymentLink: paymentLink.trim() || undefined,
              paidAt: paidAt || undefined,
              currency: docCurrency,
              updatedAt: now,
            }
          : q
      );
      setQuotes(next);
    }
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) {
        setSaveHint(`Saved locally, but cloud sync failed: ${sync.error}`);
        return;
      }
    }
    refreshStores();
    clearQuoteEditorAutosave();
    setAutosaveAvailableAt("");
    setSaveHint(`Saved locally at ${new Date().toLocaleTimeString()}`);
  }

  async function markPaidNow() {
    if (!quoteId) {
      alert("Save this quote first.");
      return;
    }
    const nowIso = new Date().toISOString();
    setStatus("paid");
    setPaidAt(nowIso);
    markQuoteStatusById(quoteId, "paid", { paidAt: nowIso });
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) {
        setSaveHint(`Marked paid locally, but cloud sync failed: ${sync.error}`);
        return;
      }
    }
    setSaveHint(`Marked paid at ${new Date(nowIso).toLocaleTimeString()}`);
  }

  async function exportImage() {
    const el = document.getElementById("quote-print");
    if (!el) return;
    const sealImages = Array.from(el.querySelectorAll("img.contract-print-seal")) as HTMLImageElement[];
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
    await compositeSealsInColorOnCanvasAsync(canvas, sealImages, el);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png", 1.0);
    a.download = `${quoteNo || "quote"}.png`;
    a.click();
  }

  async function exportPdf() {
    const el = document.getElementById("quote-print");
    if (!el) return;
    const sealImages = Array.from(el.querySelectorAll("img.contract-print-seal")) as HTMLImageElement[];
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
    await compositeSealsInColorOnCanvasAsync(canvas, sealImages, el);
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
      alert("Please select your company first.");
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
              sealImage: showSeal && company.sealImage ? company.sealImage : undefined,
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
        // Keep share URLs short: omit inline base64 images.
        lines: lines.map((l) => ({ ...l, image: undefined })),
        taxIncluded,
        taxRate,
        extraFees,
        terms,
        showSeal: showSeal === true,
        currency: docCurrency,
        validUntil,
        paymentTerms: paymentTerms.trim(),
        status,
        paymentLink: paymentLink.trim() || undefined,
        paidAt: paidAt || undefined,
      };
      const enc = await encodeSharePayload(payload);
      const base =
        typeof window !== "undefined" ? `${window.location.origin}/quote/preview` : "";
      const url = `${base}?share=${encodeURIComponent(enc)}`;
      if (url.length > 32000) {
        setShareError(
          "This quote is too large to share as a link. Reduce line items or use Export image/PDF."
        );
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
      setShareError("Could not generate share link or QR. Please try again.");
    } finally {
      setShareLoading(false);
    }
  }

  function copyShareUrl() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl).then(
      () => alert("Link copied"),
      () => {
        window.prompt("Copy this link", shareUrl);
      }
    );
  }

  function downloadShareQr() {
    if (!shareQr) return;
    const a = document.createElement("a");
    a.href = shareQr;
    a.download = `quote-share-${quoteNo || "qr"}.png`;
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
      alert("Please enter product code and name.");
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
      if (!sync.ok) alert(`Saved locally, but cloud sync failed: ${sync.error}`);
    }
    refreshStores();
  }

  async function saveQuickCustomer() {
    const rows = getCustomers();
    if (!quickCustomer.name.trim()) {
      alert("Please enter a customer name.");
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
      if (!sync.ok) alert(`Saved locally, but cloud sync failed: ${sync.error}`);
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
      alert("Could not process that image. Try another file.");
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <PageHeader
        title="New quotation"
        actions={
          <Link href="/quote">
            <TextButton variant="secondary">My quotations</TextButton>
          </Link>
        }
      />

      {formError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </div>
      ) : null}

      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={showLineImages}
          onChange={(e) => setShowLineImages(e.target.checked)}
        />
        Show product images in line items (also affects export)
      </label>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={showSeal}
          onChange={(e) => setShowSeal(e.target.checked)}
        />
        Show digital company seal (uploaded in Company settings)
      </label>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">
        Tip: Quote numbers increment when you save. Before the first save, the preview number may not change.
      </p>
      {autosaveAvailableAt && !quoteIdParam && !quoteId ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            Local draft autosaved at {new Date(autosaveAvailableAt).toLocaleString()}.
          </span>
          <TextButton variant="ghost" className="!px-0" onClick={restoreAutosave}>
            Restore
          </TextButton>
          <TextButton variant="ghost" className="!px-0" onClick={dismissAutosave}>
            Discard
          </TextButton>
        </div>
      ) : null}

      <div
        id="quote-print"
        className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-16 shrink-0 sm:w-24" aria-hidden />
            <h2 className="min-w-0 flex-1 pt-1 text-center text-xl font-semibold tracking-wide text-slate-900">
              Quotation
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
                Quote No.
                <span className="quote-no-print"> (editable)</span>
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
                placeholder="Auto generated (editable)"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Quote date</label>
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
            <div>
              <label className="text-xs text-slate-500">Valid until</label>
              <input
                type="date"
                className="mt-1 w-full min-h-11 rounded border border-slate-300 px-3 py-2.5 text-sm leading-normal"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Payment terms</label>
              <select
                className="mt-1 w-full min-h-11 rounded border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Due on receipt">Due on receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Status</label>
              <select
                className="mt-1 w-full min-h-11 rounded border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal"
                value={status}
                onChange={(e) => {
                  const next = (e.target.value as QuoteStatusBase) || "draft";
                  setStatus(next);
                  if (next !== "paid") setPaidAt("");
                }}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="accepted">Accepted</option>
                <option value="paid">Paid</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Current: {quoteDisplayStatus(status, validUntil)}
              </p>
              {paidAt ? (
                <p className="mt-1 text-xs text-emerald-700">
                  Paid at: {new Date(paidAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Payment link (optional)</label>
              <input
                type="url"
                className="mt-1 w-full min-h-11 rounded border border-slate-300 px-3 py-2.5 text-sm leading-normal"
                placeholder="https://checkout.example.com/..."
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <div
                id="quote-seller-section"
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4"
              >
                <label className="text-xs font-medium text-slate-600">Seller</label>
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
                  <option value="">Select seller</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.abbr})
                    </option>
                  ))}
                </select>
                {company ? (
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                    <div>
                      <span className="text-slate-500">Contact:</span>
                      {company.contact || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      {company.phone || "—"}
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">Address:</span>
                      {company.address || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Select a seller to show contact details.</p>
                )}
              </div>

              <div
                id="quote-customer-section"
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:p-4"
              >
                <label className="text-xs font-medium text-slate-600">Customer</label>
                <div className="quote-no-print mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="relative min-w-0 flex-1">
                    <input
                      className="w-full min-h-11 rounded border border-slate-300 bg-white px-3 py-2.5 text-sm leading-normal"
                      placeholder="Search customer"
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
                    Quick add
                  </TextButton>
                </div>
                {customer ? (
                  <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-800">
                    <div className="text-base font-semibold text-slate-900">{customer.name}</div>
                    <div>
                      <span className="text-slate-500">Contact:</span>
                      {customer.contact || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      {customer.phone || "—"}
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">Address:</span>
                      {customer.address || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="quote-no-print mt-2 text-xs text-slate-500">
                    Search and select a customer, or quick add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div id="quote-lines-section" className="py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TextButton
              variant="primary"
              className="quote-no-print"
              onClick={() => setPickerOpen(true)}
            >
              Add product
            </TextButton>
          </div>

          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900">Line items</h3>

          <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
            <table className="quote-table w-full min-w-[960px] border-collapse text-center text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {showLineImages ? (
                    <th className="border border-slate-200 px-2 py-2.5 font-medium">Image</th>
                  ) : null}
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Item</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Model</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Spec</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Unit</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Unit price</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Qty</th>
                  <th className="border border-slate-200 px-2 py-2.5 font-medium">Amount</th>
                  <th className="min-w-[8rem] border border-slate-200 px-2 py-2.5 font-medium">
                    Notes
                  </th>
                  <th className="quote-no-print border border-slate-200 px-2 py-2.5 font-medium">
                    Action
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
                      {formatMoney(l.amount, docCurrency)}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 align-top text-center">
                      <textarea
                        rows={2}
                        className="mx-auto box-border w-full min-w-[7rem] resize-y rounded border border-slate-300 px-2 py-2 text-center text-sm leading-relaxed"
                        placeholder="Notes"
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
                        Remove
                      </TextButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lines.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">No line items yet — add a product.</p>
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
                        Unit price
                        <input
                          type="text"
                          inputMode="decimal"
                          className="ml-1 box-border w-24 min-h-9 rounded border border-slate-300 px-2 py-2 text-sm leading-normal"
                          value={displayLinePrice(l, lineTextDraft)}
                          onChange={(e) => setLinePriceInput(l.id, e.target.value)}
                        />
                      </label>
                      <label className="text-xs text-slate-500">
                        Qty
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
                      Notes
                      <textarea
                        rows={2}
                        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-2 text-sm leading-relaxed"
                        value={l.remark ?? ""}
                        onChange={(e) => updateLine(l.id, { remark: e.target.value })}
                      />
                    </label>
                    <div className="mt-1 font-medium">Amount {formatMoney(l.amount, docCurrency)}</div>
                    <TextButton
                      variant="ghost"
                      className="quote-no-print mt-2 !px-0 text-red-700"
                      onClick={() => removeLine(l.id)}
                    >
                      Remove
                    </TextButton>
                  </div>
                </div>
              </div>
            ))}
            {lines.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">No line items</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex flex-wrap items-end gap-3 text-sm">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-600">Currency (ISO 4217)</span>
              <input
                className="min-h-9 w-28 rounded border border-slate-300 px-2 py-2 font-mono uppercase leading-normal"
                maxLength={3}
                autoComplete="off"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))
                }
                onBlur={() => setCurrency(normalizeDocumentCurrency(currency))}
              />
            </label>
            <span className="max-w-sm text-xs leading-snug text-slate-500">
              Totals and PDF use this code (default from Settings). Examples: USD, EUR, GBP.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={taxIncluded}
                onChange={(e) => setTaxIncluded(e.target.checked)}
              />
              Tax included
            </label>
            {taxIncluded ? (
              <label className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs text-slate-600 sm:text-sm">
                  Tax rate (%) <span className="text-slate-400">(sales tax / VAT)</span>
                </span>
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
              <span className="text-sm text-slate-600">Additional fees</span>
              <TextButton variant="secondary" className="quote-no-print" onClick={addExtraFee}>
                Add fee line
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
                  Remove
                </TextButton>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, docCurrency)}</span>
            </div>
            {taxIncluded ? (
              <div className="flex justify-between text-slate-700">
                <span>Tax</span>
                <span>{formatMoney(taxAmt, docCurrency)}</span>
              </div>
            ) : null}
            <div
              id="quote-export-extra-fees-total-row"
              className="flex justify-between text-slate-700"
            >
              <span>Additional fees</span>
              <span>{formatMoney(extraFees.reduce((s, f) => s + f.amount, 0), docCurrency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(grand, docCurrency)}</span>
            </div>
          </div>
        </div>

        {showSeal && company?.sealImage ? (
          <div className="quote-print-seal-block relative mt-6 flex justify-end">
            <div className="contract-print-seal-wrap pointer-events-none flex max-w-[58%] items-end justify-end sm:max-w-[55%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.sealImage}
                alt="Digital Company Seal"
                className="contract-print-seal h-auto max-h-[44mm] w-auto max-w-[44mm] object-contain opacity-[0.92] sm:max-h-[52mm] sm:max-w-[52mm]"
              />
            </div>
          </div>
        ) : null}

        <div id="quote-terms-section" className="mt-8 border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Terms & Conditions</h3>
            <div className="quote-no-print flex flex-wrap gap-2">
              <TextButton
                variant="secondary"
                onClick={() => {
                  saveQuoteTermsTemplate(terms);
                  alert("Saved as default terms for new quotations.");
                }}
              >
                Save as default
              </TextButton>
              <TextButton variant="secondary" onClick={addTerm}>
                Add clause
              </TextButton>
            </div>
          </div>
          {terms.length === 0 ? (
            <p className="quote-no-print text-sm text-slate-500">
              No terms yet — use “Add clause”.
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
                      placeholder={`Clause ${i + 1}`}
                    />
                  </div>
                    <TextButton
                      variant="ghost"
                      className="quote-no-print h-fit shrink-0 text-red-700"
                      onClick={() => removeTerm(i)}
                    >
                      Remove
                    </TextButton>
                  </div>
              ))}
            </div>
          )}
        </div>

        {company && (company.taxId || company.bankName) ? (
          <div className="mt-10 border-t-2 border-slate-300 pt-6 text-sm leading-relaxed text-slate-700">
            <div className="mb-2 text-xs font-medium text-slate-500">Seller payment details</div>
            {company.taxId ? (
              <div className="whitespace-pre-wrap break-words">Tax ID: {company.taxId}</div>
            ) : null}
            {company.bankName ? (
              <div className="whitespace-pre-wrap break-words">
                Bank: {company.bankName}
                {company.bankCode ? `  Account: ${company.bankCode}` : ""}
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
          Export in color (image/PDF)
        </label>
        <div className="flex flex-wrap gap-2">
        <TextButton variant="primary" onClick={saveQuote}>
          Save quotation
        </TextButton>
        <TextButton variant="secondary" onClick={() => void markPaidNow()}>
          Mark paid
        </TextButton>
        <TextButton variant="secondary" onClick={() => void openShareModal()}>
          Share
        </TextButton>
        <TextButton variant="secondary" onClick={() => void exportImage()}>
          Export image
        </TextButton>
        <TextButton variant="secondary" onClick={() => void exportPdf()}>
          Export PDF
        </TextButton>
        <Link href="/quote">
          <TextButton variant="secondary">My quotations</TextButton>
        </Link>
        </div>
      </div>

      <Modal
        open={shareOpen}
        title="Share quotation"
        onClose={closeShareModal}
        panelClassName="max-w-xl"
        footer={
          <>
            <TextButton variant="secondary" onClick={closeShareModal}>
              Close
            </TextButton>
            <TextButton variant="primary" disabled={!shareUrl} onClick={copyShareUrl}>
              Copy link
            </TextButton>
            <TextButton variant="secondary" disabled={!shareQr} onClick={downloadShareQr}>
              Download QR
            </TextButton>
          </>
        }
      >
        {shareLoading ? (
          <p className="text-center text-sm text-slate-600">Generating link and QR…</p>
        ) : null}
        {shareError ? <p className="text-sm text-red-600">{shareError}</p> : null}
        {shareUrl && !shareError ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600">
              Send the link or QR code. It opens a read-only preview. Product images are omitted to keep URLs small; use Export image/PDF for full layout with images.
            </p>
            <div>
              <label className="block text-xs text-slate-500">Share link</label>
              <input
                readOnly
                className="mt-1 w-full rounded border border-slate-300 bg-slate-50 px-2 py-2 font-mono text-xs text-slate-800"
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
            </div>
            {shareQr ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500">Scan to open</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shareQr} alt="Quotation share QR" className="h-56 w-56 rounded border border-slate-200 bg-white p-2" />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={pickerOpen}
        title="Select product"
        onClose={() => setPickerOpen(false)}
        footer={
          <TextButton variant="secondary" onClick={() => setPickerOpen(false)}>
            Close
          </TextButton>
        }
      >
        <div className="mb-3">
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search products"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>
        <TextButton variant="secondary" className="mb-3" onClick={openQuickProduct}>
          Quick add product
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
                {p.code} · {formatMoney(p.price, docCurrency)} / {p.unit}
              </div>
            </button>
          ))}
        </div>
        {productsFiltered.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-500">No matching products</p>
        ) : null}
      </Modal>

      <Modal
        open={quickProductOpen}
        title="Quick add product"
        onClose={() => setQuickProductOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setQuickProductOpen(false)}>
              Cancel
            </TextButton>
            <TextButton variant="primary" onClick={saveQuickProduct}>
              Save & close
            </TextButton>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Code"
            value={quickProduct.code}
            onChange={(e) => setQuickProduct((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Name"
            value={quickProduct.name}
            onChange={(e) => setQuickProduct((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Model"
            value={quickProduct.model}
            onChange={(e) => setQuickProduct((s) => ({ ...s, model: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Spec"
            value={quickProduct.spec}
            onChange={(e) => setQuickProduct((s) => ({ ...s, spec: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Unit"
            value={quickProduct.unit}
            onChange={(e) => setQuickProduct((s) => ({ ...s, unit: e.target.value }))}
          />
          <input
            type="number"
            step="0.01"
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Unit price"
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
        title="Quick add customer"
        onClose={() => setQuickCustomerOpen(false)}
        footer={
          <>
            <TextButton variant="secondary" onClick={() => setQuickCustomerOpen(false)}>
              Cancel
            </TextButton>
            <TextButton variant="primary" onClick={saveQuickCustomer}>
              Save & select
            </TextButton>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Customer name"
            value={quickCustomer.name}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Contact"
            value={quickCustomer.contact}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, contact: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Phone"
            value={quickCustomer.phone}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, phone: e.target.value }))}
          />
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            placeholder="Address (optional)"
            value={quickCustomer.address}
            onChange={(e) => setQuickCustomer((s) => ({ ...s, address: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
