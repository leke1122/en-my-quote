/**
 * Maps subscription plan identifiers (env / redeem codes / Stripe) to user-facing labels.
 */
export type PlanFeatures = {
  displayName: string;
  quote: boolean;
  contract: boolean;
};

export function describePlan(plan: string): PlanFeatures {
  const p = plan.trim().toLowerCase();

  if (p === "unactivated" || p === "pending") {
    return { displayName: "Inactive", quote: false, contract: false };
  }
  if (p === "trial") {
    return { displayName: "Trial (full features)", quote: true, contract: true };
  }
  if (p === "starter") {
    return { displayName: "Starter", quote: true, contract: true };
  }
  if (p === "pro") {
    return { displayName: "Pro", quote: true, contract: true };
  }
  if (p === "business") {
    return { displayName: "Business", quote: true, contract: true };
  }
  if (p === "lifetime" || p === "full_lifetime" || p === "quote_contract_lifetime") {
    return { displayName: "Lifetime (quotes + contracts)", quote: true, contract: true };
  }
  if (p === "quote_lifetime" || p === "quote_only_lifetime") {
    return { displayName: "Lifetime (quotes only)", quote: true, contract: false };
  }
  if (p === "contract_lifetime" || p === "contract_only_lifetime") {
    return { displayName: "Lifetime (contracts only)", quote: false, contract: true };
  }
  if (p === "quote_monthly" || p === "quote_only" || p === "quote") {
    return { displayName: "Quotes (legacy)", quote: true, contract: false };
  }
  if (
    p === "quote_contract_monthly" ||
    p === "quote_contract" ||
    p === "full_monthly" ||
    p === "full"
  ) {
    return { displayName: "Pro (legacy)", quote: true, contract: true };
  }
  if (p === "contract_monthly" || p === "contract_only" || p === "contract") {
    return { displayName: "Contracts (legacy)", quote: false, contract: true };
  }

  return {
    displayName: `Plan (${plan})`,
    quote: true,
    contract: true,
  };
}

/** @deprecated Prefer formatDateUS from @/lib/format for MM/DD/YYYY */
export function formatDateYmdCn(isoOrDate: string | Date | null | undefined): string {
  if (isoOrDate == null) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
