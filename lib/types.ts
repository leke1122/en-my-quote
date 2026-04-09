export interface Product {
  id: string;
  code: string;
  name: string;
  model: string;
  spec: string;
  unit: string;
  price: number;
  image?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  mainBusiness: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
}

export interface Company {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  taxId: string;
  bankName: string;
  bankCode: string;
  logo?: string;
  /** 透明 PNG 公章，用于合同乙方落款处 */
  sealImage?: string;
  abbr: string;
  isDefault: boolean;
}

export interface QuoteLine {
  id: string;
  productId?: string;
  code: string;
  name: string;
  model: string;
  spec: string;
  unit: string;
  price: number;
  qty: number;
  amount: number;
  image?: string;
  /** 明细备注 */
  remark?: string;
}

export interface QuoteExtraFee {
  id: string;
  name: string;
  amount: number;
}

export interface Quote {
  id: string;
  quoteNo: string;
  date: string;
  companyId: string;
  customerId: string;
  lines: QuoteLine[];
  taxIncluded: boolean;
  taxRate: number;
  extraFees: QuoteExtraFee[];
  /** 报价条款，多条 */
  terms: string[];
  /** 是否在报价单上显示我司公章（与合同签章页公章比例一致） */
  showSeal?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  wpsAppId: string;
  wpsAppSecret: string;
  wpsToken: string;
  /** 多维表格 file_id，见 WPS 开放平台文档 */
  wpsDbsheetFileId: string;
  /** 数据表 sheet_id */
  wpsDbsheetSheetId: string;
  /** 以下为空时按常见列名自动匹配；填写则为多维表中字段名或字段 ID */
  wpsFieldQuoteNo: string;
  wpsFieldDate: string;
  wpsFieldCustomer: string;
  wpsFieldProductName: string;
  wpsFieldModel: string;
  wpsFieldSpec: string;
  wpsFieldUnit: string;
  wpsFieldQty: string;
  wpsFieldPrice: string;
  wpsFieldAmount: string;
  feishuKbUrl: string;
}

export type QuoteCounters = Record<string, number>;

/** 销售合同签约方快照（可与客户/我司主数据同步后手工改） */
export interface ContractPartySnapshot {
  name: string;
  address: string;
  /** 代理人 / 经办人 */
  agent: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  taxId: string;
}

export interface ContractLine {
  id: string;
  /** 产品编号 NO */
  productCode: string;
  /** 产品名称 */
  name: string;
  /** 型号/规格（合并一列，与合同样式一致） */
  modelSpec: string;
  unit: string;
  qty: number;
  price: number;
  amount: number;
  remark: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  /** 签订日期 YYYY-MM-DD */
  signingDate: string;
  signingPlace: string;
  companyId: string;
  customerId: string;
  lines: ContractLine[];
  /** 合同条款（含「一、…」等，可增删） */
  clauses: string[];
  buyer: ContractPartySnapshot;
  seller: ContractPartySnapshot;
  /** 含税时按商品金额合计 × 税率计算税额，并计入合同总金额 */
  taxIncluded?: boolean;
  /** 税率（%），如 13 表示 13% */
  taxRate?: number;
  /** 其他费用（可多行）；合同总金额 = 商品金额合计 + 税额 + 其他费用合计 */
  extraFees?: QuoteExtraFee[];
  /** 由哪张报价生成 */
  sourceQuoteId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractCounters = Record<string, number>;
