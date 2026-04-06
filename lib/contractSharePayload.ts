import type { ContractLine, ContractPartySnapshot, QuoteExtraFee } from "@/lib/types";

export interface ContractSharePayload {
  type: "contract";
  contractNo: string;
  signingDate: string;
  signingPlace: string;
  companyId: string;
  customerId: string;
  lines: ContractLine[];
  clauses: string[];
  buyer: ContractPartySnapshot;
  seller: ContractPartySnapshot;
  taxIncluded?: boolean;
  taxRate?: number;
  extraFees?: QuoteExtraFee[];
  sourceQuoteId?: string;
  /** 分享时写入供方公章，便于异地预览 */
  sellerSealImage?: string;
}

export function parseContractSharePayload(raw: unknown): ContractSharePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.type === "quote") return null;
  if (typeof o.contractNo !== "string") return null;
  return {
    type: "contract",
    contractNo: o.contractNo,
    signingDate: String(o.signingDate ?? ""),
    signingPlace: String(o.signingPlace ?? ""),
    companyId: String(o.companyId ?? ""),
    customerId: String(o.customerId ?? ""),
    lines: Array.isArray(o.lines) ? (o.lines as ContractLine[]) : [],
    clauses: Array.isArray(o.clauses) ? (o.clauses as string[]) : [],
    buyer: (o.buyer as ContractPartySnapshot) ?? {
      name: "",
      address: "",
      agent: "",
      phone: "",
      bankName: "",
      bankAccount: "",
      taxId: "",
    },
    seller: (o.seller as ContractPartySnapshot) ?? {
      name: "",
      address: "",
      agent: "",
      phone: "",
      bankName: "",
      bankAccount: "",
      taxId: "",
    },
    taxIncluded: typeof o.taxIncluded === "boolean" ? o.taxIncluded : false,
    taxRate: typeof o.taxRate === "number" ? o.taxRate : 13,
    extraFees: Array.isArray(o.extraFees) ? (o.extraFees as QuoteExtraFee[]) : [],
    sourceQuoteId: typeof o.sourceQuoteId === "string" ? o.sourceQuoteId : undefined,
    sellerSealImage: typeof o.sellerSealImage === "string" ? o.sellerSealImage : undefined,
  };
}
