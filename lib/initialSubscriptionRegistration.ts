/**
 * Default subscription row for new users: inactive until redeem or payment applies a plan.
 * Keep in sync if you reintroduce email-code registration.
 */
export const REGISTRATION_SUBSCRIPTION_CREATE = {
  plan: "unactivated",
  status: "pending",
  validFrom: null,
  validUntil: null,
  provider: "manual",
} as const;
