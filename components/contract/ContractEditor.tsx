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
import { CONTRACT_INTRO } from "@/lib/contractDefaults";
import {
  contractExtraFeesTotal,
  contractGrandTotalFromState,
  contractLinesSubtotal,
  contractTaxFromSubtotal,
} from "@/lib/contractTotals";
import { canvasGrayscaleForExport } from "@/lib/canvasGrayscale";
import { compositeSealsInColorOnCanvasAsync } from "@/lib/contractExportSeal";
import { contractHtml2canvasOnClone } from "@/lib/contractPrintHtml2Canvas";
import type { ContractSharePayload } from "@/lib/contractSharePayload";
import { commitNextContractNo, peekNextContractNo } from "@/lib/contractNumber";
import { encodeSharePayload } from "@/lib/share";
import { formatMoney, normalizeDocumentCurrency } from "@/lib/format";
import { partyFromCompany, partyFromCustomer } from "@/lib/partyFromMasters";
import { quoteDisplayStatus } from "@/lib/quoteStatus";
import { quoteLinesToContractLines } from "@/lib/quoteToContract";
import { dateToYmdCompact } from "@/lib/quoteNumber";
import {
  getCompanies,
  getContracts,
  getCustomers,
  getProducts,
  getQuotes,
  getSettings,
  markQuoteStatusById,
  setContracts,
  setProducts,
} from "@/lib/storage";
import type {
  Company,
  Contract,
  ContractLine,
  ContractPartySnapshot,
  Customer,
  Product,
  Quote,
  QuoteExtraFee,
} from "@/lib/types";

function todayIso(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function newLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cl-${Date.now()}-${Math.random()}`;
}

function calcLineAmount(price: number, qty: number): number {
  return Math.round(price * qty * 100) / 100;
}

const emptyParty: ContractPartySnapshot = {
  name: "",
  address: "",
  agent: "",
  phone: "",
  bankName: "",
  bankAccount: "",
  taxId: "",
};

const emptyQuickProduct: Omit<Product, "id"> = {
  code: "",
  name: "",
  model: "",
  spec: "",
  unit: "",
  price: 0,
  image: "",
};

type LineTextDraft = Record<string, { price?: string; qty?: string }>;
type ExtraFeeAmountDraft = Record<string, string>;
const CONTRACT_CLAUSES_TEMPLATE_KEY = "contract_clauses_template_v1";

function loadContractClausesTemplate(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTRACT_CLAUSES_TEMPLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveContractClausesTemplate(clauses: string[]): void {
  if (typeof window === "undefined") return;
  const clean = clauses.map((c) => c.trim()).filter(Boolean);
  localStorage.setItem(CONTRACT_CLAUSES_TEMPLATE_KEY, JSON.stringify(clean));
}

function displayLinePrice(l: ContractLine, draft: LineTextDraft): string {
  const v = draft[l.id]?.price;
  if (v !== undefined) return v;
  return l.price === 0 ? "" : String(l.price);
}

function displayLineQty(l: ContractLine, draft: LineTextDraft): string {
  const v = draft[l.id]?.qty;
  if (v !== undefined) return v;
  return l.qty === 0 ? "" : String(l.qty);
}

function displayExtraFeeAmount(f: QuoteExtraFee, draft: ExtraFeeAmountDraft): string {
  const v = draft[f.id];
  if (v !== undefined) return v;
  return f.amount === 0 ? "" : String(f.amount);
}

function clausesHasContent(clauses: string[]): boolean {
  return clauses.some((t) => t.trim().length > 0);
}

function newProductCode(existing: Product[]): string {
  return `P${String(existing.length + 1).padStart(5, "0")}`;
}

export function ContractEditor() {
  const router = useRouter();
  const sp = useSearchParams();
  const subCtx = useSubscriptionAccess();
  const contractIdParam = sp.get("id");
  const fromQuoteParam = sp.get("fromQuote");
  const shareParam = sp.get("share");
  const allowQuoteBridge = !subCtx.cloudAuthEnabled || subCtx.canQuoteToContract;

  const [companies, setCompaniesState] = useState<Company[]>([]);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);

  const [contractId, setContractId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [contractNo, setContractNo] = useState("");
  const [signingDate, setSigningDate] = useState(todayIso);
  const [signingPlace, setSigningPlace] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustDrop, setShowCustDrop] = useState(false);

  const [lines, setLines] = useState<ContractLine[]>([]);
  const [clauses, setClauses] = useState<string[]>([]);
  const [buyer, setBuyer] = useState<ContractPartySnapshot>(emptyParty);
  const [seller, setSeller] = useState<ContractPartySnapshot>(emptyParty);
  const [sourceQuoteId, setSourceQuoteId] = useState<string | undefined>();
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [extraFees, setExtraFees] = useState<QuoteExtraFee[]>([]);
  const [extraFeeAmountDraft, setExtraFeeAmountDraft] = useState<ExtraFeeAmountDraft>({});

  const [lineTextDraft, setLineTextDraft] = useState<LineTextDraft>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickQuoteOpen, setPickQuoteOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState(emptyQuickProduct);

  const [contractNoLocked, setContractNoLocked] = useState(false);
  const [suppressAutoNo, setSuppressAutoNo] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareQr, setShareQr] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [saveHint, setSaveHint] = useState("");
  const [exportInColor, setExportInColor] = useState(false);

  const refreshStores = useCallback(() => {
    setCompaniesState(getCompanies());
    setCustomersState(getCustomers());
    setProductsState(getProducts());
  }, []);

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  const company = useMemo(() => companies.find((c) => c.id === companyId), [companies, companyId]);
  const customer = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const sourceQuote = useMemo(
    () => (sourceQuoteId ? getQuotes().find((q) => q.id === sourceQuoteId) : undefined),
    [sourceQuoteId]
  );

  const docCurrency = useMemo(() => normalizeDocumentCurrency(currency), [currency]);

  const ymdCompact = dateToYmdCompact(signingDate);
  const subtotal = useMemo(() => contractLinesSubtotal(lines), [lines]);
  const taxAmt = useMemo(
    () => contractTaxFromSubtotal(subtotal, taxIncluded, taxRate),
    [subtotal, taxIncluded, taxRate]
  );
  const extraFeesSum = useMemo(() => contractExtraFeesTotal(extraFees), [extraFees]);
  const grandTotal = useMemo(
    () => contractGrandTotalFromState(lines, taxIncluded, taxRate, extraFees),
    [lines, taxIncluded, taxRate, extraFees]
  );
  const custFiltered = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 50);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.contact.toLowerCase().includes(q)
    );
  }, [customers, customerQuery]);

  const productsFiltered = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const loadFromQuote = useCallback((q: Quote) => {
    const comp = getCompanies().find((c) => c.id === q.companyId);
    const cust = getCustomers().find((c) => c.id === q.customerId);
    setContractId(null);
    setIsDraft(true);
    setSuppressAutoNo(false);
    setSigningDate(q.date);
    setSigningPlace("");
    setCompanyId(q.companyId);
    setCustomerId(q.customerId);
    setCustomerQuery(cust?.name ?? "");
    setLines(quoteLinesToContractLines(q.lines));
    setClauses(loadContractClausesTemplate());
    setBuyer(cust ? partyFromCustomer(cust) : emptyParty);
    setSeller(comp ? partyFromCompany(comp) : emptyParty);
    setSourceQuoteId(q.id);
    setTaxIncluded(!!q.taxIncluded);
    setTaxRate(typeof q.taxRate === "number" ? q.taxRate : Number(q.taxRate) || 0);
    setCurrency(q.currency ?? getSettings().documentCurrency);
    setExtraFees(Array.isArray(q.extraFees) ? q.extraFees.map((f) => ({ ...f })) : []);
    setExtraFeeAmountDraft({});
    setLineTextDraft({});
    setContractNoLocked(false);
    const ymd = dateToYmdCompact(q.date);
    setContractNo(peekNextContractNo(ymd));
    setPickQuoteOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = () => {
      let shareEnc: string | null = shareParam;
      if (shareEnc) {
        try {
          shareEnc = decodeURIComponent(shareEnc);
        } catch {
          /* noop */
        }
      }
      if (!shareEnc && typeof window !== "undefined") {
        const h = window.location.hash;
        if (h.startsWith("#share=")) {
          shareEnc = h.slice(7);
          try {
            shareEnc = decodeURIComponent(shareEnc);
          } catch {
            /* noop */
          }
        }
      }

      if (contractIdParam) {
        const c = getContracts().find((x) => x.id === contractIdParam);
        if (c && !cancelled) {
          setContractId(c.id);
          setIsDraft(false);
          setSuppressAutoNo(false);
          setContractNo(c.contractNo);
          setSigningDate(c.signingDate);
          setSigningPlace(c.signingPlace);
          setCompanyId(c.companyId);
          setCustomerId(c.customerId);
          setCustomerQuery("");
          setLines(c.lines);
          setClauses(c.clauses);
          setBuyer(c.buyer);
          setSeller(c.seller);
          setTaxIncluded(!!c.taxIncluded);
          setTaxRate(typeof c.taxRate === "number" ? c.taxRate : Number(c.taxRate) || 0);
          setCurrency(c.currency ?? getSettings().documentCurrency);
          setExtraFees(Array.isArray(c.extraFees) ? c.extraFees.map((f) => ({ ...f })) : []);
          setExtraFeeAmountDraft({});
          setSourceQuoteId(c.sourceQuoteId);
          setLineTextDraft({});
          setContractNoLocked(false);
        }
        return;
      }

      if (fromQuoteParam) {
        if (subCtx.cloudAuthEnabled && !subCtx.canQuoteToContract) {
          router.replace("/contract/new");
          return;
        }
        const q = getQuotes().find((x) => x.id === fromQuoteParam);
        if (q && !cancelled) loadFromQuote(q);
        return;
      }

      if (shareEnc && !contractIdParam && !fromQuoteParam) {
        router.replace(`/contract/preview?share=${encodeURIComponent(shareEnc)}`);
        return;
      }

      if (cancelled) return;
      const comps = getCompanies();
      const def = comps.find((c) => c.isDefault) ?? comps[0];
      setContractId(null);
      setIsDraft(true);
      setSuppressAutoNo(false);
      setSigningDate(todayIso());
      setSigningPlace("");
      setCompanyId(def?.id ?? "");
      setCustomerId("");
      setCustomerQuery("");
      setLines([]);
      setClauses(loadContractClausesTemplate());
      setBuyer(emptyParty);
      setSeller(def ? partyFromCompany(def) : emptyParty);
      setTaxIncluded(false);
      setTaxRate(0);
      setCurrency(getSettings().documentCurrency);
      setExtraFees([]);
      setExtraFeeAmountDraft({});
      setSourceQuoteId(undefined);
      setLineTextDraft({});
      setContractNoLocked(false);
      const d = dateToYmdCompact(todayIso());
      setContractNo(peekNextContractNo(d));
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    contractIdParam,
    fromQuoteParam,
    shareParam,
    loadFromQuote,
    router,
    subCtx.cloudAuthEnabled,
    subCtx.canQuoteToContract,
  ]);

  useEffect(() => {
    if (!isDraft || suppressAutoNo || contractNoLocked) return;
    setContractNo(peekNextContractNo(ymdCompact));
  }, [isDraft, suppressAutoNo, contractNoLocked, ymdCompact]);

  function syncPartiesFromMasters() {
    if (customer) setBuyer(partyFromCustomer(customer));
    if (company) setSeller(partyFromCompany(company));
  }

  function updateLine(id: string, patch: Partial<ContractLine>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const price = patch.price ?? l.price;
        const qty = patch.qty ?? l.qty;
        const amount = calcLineAmount(price, qty);
        return { ...l, ...patch, price, qty, amount };
      })
    );
  }

  function setLinePriceInput(id: string, raw: string) {
    if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setLineTextDraft((prev) => ({ ...prev, [id]: { ...prev[id], price: raw } }));
    const n = raw === "" || raw === "." || raw === "-" ? 0 : Number.parseFloat(raw);
    updateLine(id, { price: Number.isFinite(n) ? n : 0 });
  }

  function setLineQtyInput(id: string, raw: string) {
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setLineTextDraft((prev) => ({ ...prev, [id]: { ...prev[id], qty: raw } }));
    const n = raw === "" || raw === "." ? 0 : Number.parseFloat(raw);
    updateLine(id, { qty: Number.isFinite(n) ? n : 0 });
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setLineTextDraft((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
  }

  function addProductLine(p: Product) {
    const price = p.price;
    const qty = 1;
    const line: ContractLine = {
      id: newLineId(),
      productCode: p.code,
      name: p.name,
      modelSpec: [p.model, p.spec].filter(Boolean).join(" / ") || "—",
      unit: p.unit,
      qty,
      price,
      amount: calcLineAmount(price, qty),
      remark: "",
    };
    setLines((prev) => [...prev, line]);
    setPickerOpen(false);
    setProductSearch("");
  }

  function addClause() {
    setClauses((prev) => [...prev, ""]);
  }

  function updateClause(i: number, text: string) {
    setClauses((prev) => prev.map((c, j) => (j === i ? text : c)));
  }

  function removeClause(i: number) {
    setClauses((prev) => prev.filter((_, j) => j !== i));
  }

  function addExtraFee() {
    setExtraFees((prev) => [...prev, { id: newLineId(), name: "Additional fee", amount: 0 }]);
  }

  function updateExtraFee(id: string, patch: Partial<QuoteExtraFee>) {
    setExtraFees((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeExtraFee(id: string) {
    setExtraFees((prev) => prev.filter((f) => f.id !== id));
    setExtraFeeAmountDraft((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
  }

  function setExtraFeeAmountInput(id: string, raw: string) {
    if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setExtraFeeAmountDraft((prev) => ({ ...prev, [id]: raw }));
    const n = raw === "" || raw === "." || raw === "-" ? 0 : Number.parseFloat(raw);
    updateExtraFee(id, { amount: Number.isFinite(n) ? n : 0 });
  }

  async function saveContract() {
    if (!companyId) {
      alert("Please select a seller (your company).");
      return;
    }
    if (!customerId) {
      alert("Please select a buyer (customer).");
      return;
    }
    if (lines.length === 0) {
      alert("Please add at least one line item.");
      return;
    }
    const now = new Date().toISOString();
    const all = getContracts();
    let finalNo = contractNo.trim();
    let id = contractId;

    if (isDraft || !contractId) {
      const ymd = dateToYmdCompact(signingDate);
      const previewNo = peekNextContractNo(ymd);
      finalNo = !finalNo || finalNo === previewNo ? commitNextContractNo(ymd) : finalNo;
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ct-${Date.now()}`;
      const created: Contract = {
        id: id!,
        contractNo: finalNo,
        signingDate,
        signingPlace: signingPlace.trim(),
        companyId,
        customerId,
        lines,
        clauses,
        buyer,
        seller,
        taxIncluded,
        taxRate,
        extraFees: extraFees.map((f) => ({ ...f })),
        sourceQuoteId,
        currency: docCurrency,
        createdAt: now,
        updatedAt: now,
      };
      setContracts([...all, created]);
      if (sourceQuoteId) {
        markQuoteStatusById(sourceQuoteId, "accepted");
      }
      setContractId(id);
      setContractNo(finalNo);
      setIsDraft(false);
    } else {
      const next = all.map((c) =>
        c.id === contractId
          ? {
              ...c,
              contractNo: contractNo.trim(),
              signingDate,
              signingPlace: signingPlace.trim(),
              companyId,
              customerId,
              lines,
              clauses,
              buyer,
              seller,
              taxIncluded,
              taxRate,
              extraFees: extraFees.map((f) => ({ ...f })),
              sourceQuoteId,
              currency: docCurrency,
              updatedAt: now,
            }
          : c
      );
      setContracts(next);
      if (sourceQuoteId) {
        markQuoteStatusById(sourceQuoteId, "accepted");
      }
    }
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) {
        setSaveHint(`Saved locally, but cloud sync failed: ${sync.error}`);
        return;
      }
    }
    refreshStores();
    setSaveHint(`Saved locally at ${new Date().toLocaleTimeString()}`);
  }

  async function exportImage() {
    const el = document.getElementById("contract-print");
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
        contractHtml2canvasOnClone(clonedDoc, {
          hasClausesContent: clausesHasContent(clauses),
        }),
    });
    if (!exportInColor) {
      canvas = canvasGrayscaleForExport(canvas);
    }
    await compositeSealsInColorOnCanvasAsync(canvas, sealImages, el);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png", 1.0);
    a.download = `${contractNo || "contract"}.png`;
    a.click();
  }

  async function exportPdf() {
    const el = document.getElementById("contract-print");
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
        contractHtml2canvasOnClone(clonedDoc, {
          hasClausesContent: clausesHasContent(clauses),
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
    pdf.save(`${contractNo || "contract"}.pdf`);
  }

  async function openShareModal() {
    if (!companyId) {
      alert("Please select a seller (your company) first.");
      return;
    }
    setShareOpen(true);
    setShareLoading(true);
    setShareError("");
    setShareUrl("");
    setShareQr("");
    try {
      const payload: ContractSharePayload = {
        type: "contract",
        contractNo,
        signingDate,
        signingPlace,
        companyId,
        customerId,
        lines,
        clauses,
        buyer,
        seller,
        taxIncluded,
        taxRate,
        extraFees: extraFees.map((f) => ({ ...f })),
        sourceQuoteId,
        sellerSealImage: company?.sealImage,
        currency: docCurrency,
      };
      const enc = await encodeSharePayload(payload);
      const url = `${window.location.origin}/contract/preview?share=${encodeURIComponent(enc)}`;
      setShareUrl(url);
      setShareQr(await QRCode.toDataURL(url, { margin: 1, width: 320 }));
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "Failed to generate share link");
    } finally {
      setShareLoading(false);
    }
  }

  function closeShareModal() {
    setShareOpen(false);
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    alert("Link copied");
  }

  function downloadShareQr() {
    if (!shareQr) return;
    const a = document.createElement("a");
    a.href = shareQr;
    a.download = `${contractNo || "contract"}-share-qr.png`;
    a.click();
  }

  async function saveQuickProduct() {
    if (!quickProduct.name.trim()) {
      alert("Please enter a product name.");
      return;
    }
    const rows = getProducts();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}`;
    const p: Product = {
      id,
      ...quickProduct,
      code: quickProduct.code.trim() || newProductCode(rows),
    };
    setProducts([...rows, p]);
    setProductsState([...rows, p]);
    addProductLine(p);
    setQuickProductOpen(false);
    setQuickProduct(emptyQuickProduct);
    if (subCtx.cloudAuthEnabled && subCtx.loggedIn) {
      const sync = await pushProjectDataToCloud(true);
      if (!sync.ok) alert(`Saved locally, but cloud sync failed: ${sync.error}`);
    }
  }

  const partyField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    className = ""
  ) => (
    <div className={`flex flex-wrap items-center gap-x-1 text-sm leading-normal text-slate-900 ${className}`}>
      <span className="shrink-0">{label}:</span>
      <input
        className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm leading-normal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <PageHeader
        title="New contract"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/contract">
              <TextButton variant="secondary">My contracts</TextButton>
            </Link>
            <Link href="/">
              <TextButton variant="secondary">Home</TextButton>
            </Link>
          </div>
        }
      />

      <div className="quote-no-print mb-3 flex flex-wrap items-center gap-2">
        {allowQuoteBridge ? (
          <TextButton variant="secondary" onClick={() => setPickQuoteOpen(true)}>
            Create from quote…
          </TextButton>
        ) : (
          <p className="text-xs text-amber-800">
            “Create from quote” requires a plan that includes both Quotes and Contracts.
          </p>
        )}
        <TextButton variant="secondary" onClick={syncPartiesFromMasters}>
          Sync party details from Customer / Company
        </TextButton>
      </div>
      {sourceQuote ? (
        <section className="quote-no-print mb-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">Source quote: {sourceQuote.quoteNo}</span>
            <span className="rounded bg-white px-2 py-0.5 text-xs uppercase">
              {quoteDisplayStatus(sourceQuote.status, sourceQuote.validUntil)}
            </span>
            <span>valid until {sourceQuote.validUntil || "—"}</span>
            <span>payment terms {sourceQuote.paymentTerms || "—"}</span>
            <TextButton
              variant="ghost"
              className="!px-0"
              onClick={() => router.push(`/quote/new?id=${encodeURIComponent(sourceQuote.id)}`)}
            >
              Open quote
            </TextButton>
            {sourceQuote.paymentLink ? (
              <a
                href={sourceQuote.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open payment link
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <div
        id="contract-print"
        className="quote-document mx-auto max-w-[210mm] rounded-lg border border-slate-300 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-slate-900">Contract</h2>

        <div className="contract-print-header-grid mb-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="shrink-0 font-medium text-slate-700">Buyer:</span>
              <span className="text-slate-900">{customer?.name || buyer.name || "—"}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="shrink-0 font-medium text-slate-700">Seller:</span>
              <span className="text-slate-900">{company?.name || seller.name || "—"}</span>
            </div>
          </div>
          <div className="contract-print-header-right space-y-2 text-sm sm:text-right">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="text-slate-600">Contract No.</span>
              <input
                className="min-w-[10rem] rounded border border-slate-300 px-2 py-1 text-sm"
                value={contractNo}
                onChange={(e) => {
                  setContractNoLocked(true);
                  setContractNo(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="text-slate-600">Date</span>
              <input
                type="date"
                className="rounded border border-slate-300 px-2 py-1 text-sm"
                value={signingDate}
                onChange={(e) => {
                  setSuppressAutoNo(false);
                  setContractNoLocked(false);
                  setSigningDate(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="text-slate-600">Place</span>
              <input
                className="min-w-[10rem] rounded border border-slate-300 px-2 py-1 text-sm"
                value={signingPlace}
                onChange={(e) => setSigningPlace(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <p className="contract-print-intro mb-6 text-sm leading-loose text-slate-800 indent-8">{CONTRACT_INTRO}</p>

        <p className="mb-2 text-sm font-semibold text-slate-900">1. Line items</p>

        <div className="quote-print-lines-desktop quote-print-lines-wrap hidden md:block overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse border border-slate-800 text-center text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-800 px-1 py-2 font-medium">Item code</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Item</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Model / Spec</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Unit</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Qty</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Unit price</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Amount</th>
                <th className="border border-slate-800 px-1 py-2 font-medium">Notes</th>
                <th className="quote-no-print border border-slate-800 px-1 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      className="mx-auto block w-full min-w-[4rem] border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={l.productCode}
                      onChange={(e) => updateLine(l.id, { productCode: e.target.value })}
                    />
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      className="mx-auto block w-full min-w-[6rem] border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={l.name}
                      onChange={(e) => updateLine(l.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      className="mx-auto block w-full min-w-[6rem] border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={l.modelSpec}
                      onChange={(e) => updateLine(l.id, { modelSpec: e.target.value })}
                    />
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      className="mx-auto block w-12 border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={l.unit}
                      onChange={(e) => updateLine(l.id, { unit: e.target.value })}
                    />
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="mx-auto block w-16 border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={displayLineQty(l, lineTextDraft)}
                      onChange={(e) => setLineQtyInput(l.id, e.target.value)}
                    />
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="mx-auto block w-20 border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={displayLinePrice(l, lineTextDraft)}
                      onChange={(e) => setLinePriceInput(l.id, e.target.value)}
                    />
                  </td>
                  <td className="whitespace-nowrap border border-slate-800 px-1 py-1 align-top text-center">
                    {formatMoney(l.amount, docCurrency)}
                  </td>
                  <td className="border border-slate-800 px-1 py-1 align-top">
                    <input
                      className="mx-auto block w-full min-w-[4rem] border-0 bg-transparent px-1 py-0.5 text-center text-sm outline-none"
                      value={l.remark}
                      onChange={(e) => updateLine(l.id, { remark: e.target.value })}
                    />
                  </td>
                  <td className="quote-no-print border border-slate-800 px-1 py-1 align-top text-center">
                    <TextButton variant="ghost" className="!px-0 text-red-700" onClick={() => removeLine(l.id)}>
                      Remove
                    </TextButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="quote-print-lines-mobile space-y-3 md:hidden">
          {lines.map((l) => (
            <div key={l.id} className="rounded border border-slate-300 p-3 text-sm">
              <div className="font-medium">{l.name}</div>
              <div className="mt-1 text-xs text-slate-600">
                {l.productCode} · {l.modelSpec}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs">
                  Qty
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-0.5 w-full rounded border px-2 py-1"
                    value={displayLineQty(l, lineTextDraft)}
                    onChange={(e) => setLineQtyInput(l.id, e.target.value)}
                  />
                </label>
                <label className="text-xs">
                  Unit price
                  <input
                    type="text"
                    inputMode="decimal"
                    className="mt-0.5 w-full rounded border px-2 py-1"
                    value={displayLinePrice(l, lineTextDraft)}
                    onChange={(e) => setLinePriceInput(l.id, e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-1 font-medium">Amount {formatMoney(l.amount, docCurrency)}</div>
              <TextButton variant="ghost" className="quote-no-print mt-2 !px-0 text-red-700" onClick={() => removeLine(l.id)}>
                Remove
              </TextButton>
            </div>
          ))}
        </div>

        <div className="quote-no-print mt-3 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:mt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Seller (your company)</label>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={companyId}
                onChange={(e) => {
                  setSuppressAutoNo(false);
                  setContractNoLocked(false);
                  setCompanyId(e.target.value);
                  const c = getCompanies().find((x) => x.id === e.target.value);
                  if (c) setSeller(partyFromCompany(c));
                }}
              >
                <option value="">Select</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.abbr})
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="text-xs font-medium text-slate-600">Buyer (customer)</label>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
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
                        setBuyer(partyFromCustomer(c));
                        setShowCustDrop(false);
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <TextButton variant="primary" onClick={() => setPickerOpen(true)}>
              Add line item
            </TextButton>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-4 text-sm">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-slate-600">Currency (ISO 4217)</span>
              <input
                className="min-h-9 w-28 rounded border border-slate-800 px-2 py-1.5 font-mono uppercase leading-normal"
                maxLength={3}
                autoComplete="off"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))
                }
                onBlur={() => setCurrency(normalizeDocumentCurrency(currency))}
              />
            </label>
            <span className="max-w-sm text-xs leading-snug text-slate-600">
              Totals and PDF use this code (default from Settings).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-slate-800">
              <input
                type="checkbox"
                checked={taxIncluded}
                onChange={(e) => setTaxIncluded(e.target.checked)}
              />
              Tax included
            </label>
            {taxIncluded ? (
              <label className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2 text-slate-800">
                <span className="text-xs sm:text-sm">
                  Tax rate (%) <span className="text-slate-500">(sales tax / VAT)</span>
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="min-h-9 w-24 rounded border border-slate-800 px-2 py-1.5 leading-normal"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                />
              </label>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-800">Additional fees</span>
              <TextButton variant="secondary" className="quote-no-print" onClick={addExtraFee}>
                Add fee line
              </TextButton>
            </div>
            {extraFees.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center gap-2">
                <input
                  className="min-h-9 flex-1 rounded border border-slate-800 px-2 py-1.5 text-sm sm:max-w-xs"
                  value={f.name}
                  onChange={(e) => updateExtraFee(f.id, { name: e.target.value })}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className="min-h-9 w-28 rounded border border-slate-800 px-2 py-1.5 text-sm"
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
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
            <div className="flex flex-wrap justify-between gap-2 text-slate-800">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal, docCurrency)}</span>
            </div>
            {taxIncluded ? (
              <div className="flex flex-wrap justify-between gap-2 text-slate-800">
                <span>Tax ({taxRate}%)</span>
                <span>{formatMoney(taxAmt, docCurrency)}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-between gap-2 text-slate-800">
              <span>Additional fees</span>
              <span>{formatMoney(extraFeesSum, docCurrency)}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(grandTotal, docCurrency)}</span>
            </div>
          </div>
        </div>

        <div id="contract-clauses-section" className="mt-8 border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Terms & Conditions</h3>
            <div className="quote-no-print flex flex-wrap gap-2">
              <TextButton
                variant="secondary"
                onClick={() => {
                  saveContractClausesTemplate(clauses);
                  alert("Saved as default clauses for new contracts.");
                }}
              >
                Save as default
              </TextButton>
              <TextButton variant="secondary" onClick={addClause}>
                Add clause
              </TextButton>
            </div>
          </div>
          {clauses.length === 0 ? (
            <p className="quote-no-print text-sm text-slate-500">No clauses yet</p>
          ) : (
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-800">
              {clauses.map((t, i) => (
                <li key={i} className="pl-1">
                  <div className="flex gap-2">
                    <textarea
                      rows={3}
                      className="min-h-[4rem] flex-1 rounded border border-slate-300 px-3 py-2"
                      value={t}
                      onChange={(e) => updateClause(i, e.target.value)}
                    />
                    <TextButton variant="ghost" className="quote-no-print h-fit shrink-0 text-red-700" onClick={() => removeClause(i)}>
                      Remove
                    </TextButton>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-10 border-t-2 border-slate-800 pt-6">
          <p className="mb-4 text-center text-sm font-semibold text-slate-900">Party details</p>
          <div className="contract-print-parties-grid grid gap-6 sm:grid-cols-2">
            <div className="rounded border border-slate-300 p-4">
              <p className="mb-3 text-sm font-bold text-slate-900">Buyer</p>
              <div className="grid gap-2">
                {partyField("Name", buyer.name, (v) => setBuyer((b) => ({ ...b, name: v })))}
                {partyField("Address", buyer.address, (v) => setBuyer((b) => ({ ...b, address: v })))}
                {partyField("Agent", buyer.agent, (v) => setBuyer((b) => ({ ...b, agent: v })))}
                {partyField("Phone", buyer.phone, (v) => setBuyer((b) => ({ ...b, phone: v })))}
                {partyField("Bank", buyer.bankName, (v) => setBuyer((b) => ({ ...b, bankName: v })))}
                {partyField("Account", buyer.bankAccount, (v) => setBuyer((b) => ({ ...b, bankAccount: v })))}
                {partyField("Tax ID", buyer.taxId, (v) => setBuyer((b) => ({ ...b, taxId: v })))}
              </div>
            </div>
            <div className="relative rounded border border-slate-300 p-4 pb-20 sm:pb-[4.5rem]">
              <p className="mb-3 text-sm font-bold text-slate-900">Seller</p>
              <div className="grid gap-2">
                {partyField("Name", seller.name, (v) => setSeller((s) => ({ ...s, name: v })))}
                {partyField("Address", seller.address, (v) => setSeller((s) => ({ ...s, address: v })))}
                {partyField("Agent", seller.agent, (v) => setSeller((s) => ({ ...s, agent: v })))}
                {partyField("Phone", seller.phone, (v) => setSeller((s) => ({ ...s, phone: v })))}
                {partyField("Bank", seller.bankName, (v) => setSeller((s) => ({ ...s, bankName: v })))}
                {partyField("Account", seller.bankAccount, (v) => setSeller((s) => ({ ...s, bankAccount: v })))}
                {partyField("Tax ID", seller.taxId, (v) => setSeller((s) => ({ ...s, taxId: v })))}
              </div>
              {company?.sealImage ? (
                <div className="contract-print-seal-wrap pointer-events-none absolute bottom-3 right-3 flex max-w-[58%] items-end justify-end sm:max-w-[55%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.sealImage}
                    alt="Digital Company Seal"
                    className="contract-print-seal h-auto max-h-[44mm] w-auto max-w-[44mm] object-contain opacity-[0.92] sm:max-h-[52mm] sm:max-w-[52mm]"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {saveHint ? <p className="text-sm text-emerald-700">{saveHint}</p> : null}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={exportInColor} onChange={(e) => setExportInColor(e.target.checked)} />
          Export in color (image/PDF)
        </label>
        <div className="flex flex-wrap gap-2">
          <TextButton variant="primary" onClick={saveContract}>
            Save contract
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
        </div>
      </div>

      <Modal
        open={pickQuoteOpen}
        title="Create from quote"
        onClose={() => setPickQuoteOpen(false)}
        footer={
          <TextButton variant="secondary" onClick={() => setPickQuoteOpen(false)}>
            Close
          </TextButton>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Pick a saved quotation. We’ll copy line items, parties and default clauses into this contract.
        </p>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {getQuotes()
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((q) => (
              <button
                key={q.id}
                type="button"
                className="w-full rounded border border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => loadFromQuote(q)}
              >
                <span className="font-medium">{q.quoteNo}</span>
                <span className="text-slate-500"> · {q.date} · </span>
                <span>{getCustomers().find((c) => c.id === q.customerId)?.name ?? "—"}</span>
              </button>
            ))}
        </div>
        {getQuotes().length === 0 ? <p className="py-4 text-center text-sm text-slate-500">No local quotations</p> : null}
      </Modal>

      <Modal
        open={shareOpen}
        title="Share contract"
        onClose={closeShareModal}
        panelClassName="max-w-xl"
        footer={
          <>
            <TextButton variant="secondary" onClick={closeShareModal}>
              Close
            </TextButton>
            <TextButton variant="primary" disabled={!shareUrl} onClick={() => void copyShareUrl()}>
              Copy link
            </TextButton>
            <TextButton variant="secondary" disabled={!shareQr} onClick={downloadShareQr}>
              Download QR
            </TextButton>
          </>
        }
      >
        {shareLoading ? <p className="text-center text-sm text-slate-600">Generating…</p> : null}
        {shareError ? <p className="text-sm text-red-600">{shareError}</p> : null}
        {shareUrl && !shareError ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600">
              Send the link or QR code to your customer. It opens a read-only preview (same style as the default export).
            </p>
            <input
              readOnly
              className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-2 font-mono text-xs"
              value={shareUrl}
              onFocus={(e) => e.target.select()}
            />
            {shareQr ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shareQr} alt="" className="h-56 w-56 rounded border bg-white p-2" />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={pickerOpen}
        title="Select a product"
        onClose={() => setPickerOpen(false)}
        footer={
          <TextButton variant="secondary" onClick={() => setPickerOpen(false)}>
            Close
          </TextButton>
        }
      >
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          placeholder="Search"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
        />
        <TextButton variant="secondary" className="mb-3" onClick={() => setQuickProductOpen(true)}>
          Quick add product
        </TextButton>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {productsFiltered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full rounded border px-2 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => addProductLine(p)}
            >
              {p.name} · {p.code}
            </button>
          ))}
        </div>
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
              Save & add to contract
            </TextButton>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <input
            className="w-full rounded border px-2 py-1.5"
            placeholder="Name"
            value={quickProduct.name}
            onChange={(e) => setQuickProduct((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="w-full rounded border px-2 py-1.5"
            placeholder="Code"
            value={quickProduct.code}
            onChange={(e) => setQuickProduct((s) => ({ ...s, code: e.target.value }))}
          />
          <input
            className="w-full rounded border px-2 py-1.5"
            placeholder="Model"
            value={quickProduct.model}
            onChange={(e) => setQuickProduct((s) => ({ ...s, model: e.target.value }))}
          />
          <input
            className="w-full rounded border px-2 py-1.5"
            placeholder="Spec"
            value={quickProduct.spec}
            onChange={(e) => setQuickProduct((s) => ({ ...s, spec: e.target.value }))}
          />
          <input
            className="w-full rounded border px-2 py-1.5"
            placeholder="Unit"
            value={quickProduct.unit}
            onChange={(e) => setQuickProduct((s) => ({ ...s, unit: e.target.value }))}
          />
          <input
            type="number"
            className="w-full rounded border px-2 py-1.5"
            placeholder="Unit price"
            value={quickProduct.price || ""}
            onChange={(e) => setQuickProduct((s) => ({ ...s, price: Number.parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </Modal>
    </div>
  );
}
