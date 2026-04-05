import type { Company, ContractPartySnapshot, Customer } from "./types";

export function partyFromCustomer(c: Customer): ContractPartySnapshot {
  return {
    name: c.name,
    address: c.address,
    agent: c.contact,
    phone: c.phone,
    bankName: c.bankName,
    bankAccount: c.bankAccount,
    taxId: c.taxId,
  };
}

export function partyFromCompany(c: Company): ContractPartySnapshot {
  return {
    name: c.name,
    address: c.address,
    agent: c.contact,
    phone: c.phone,
    bankName: c.bankName,
    bankAccount: "",
    taxId: c.taxId,
  };
}
