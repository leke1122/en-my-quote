export const enUS = {
  common: {
    backHome: "Back to home",
    loading: "Loading…",
    signIn: "Sign in",
    signUp: "Sign up",
  },
  marketing: {
    productName: "QuoteFlow",
    tagline: "Mobile-first quoting, proposals and e‑signatures",
    heroTitle: "Create quotes & proposals in minutes",
    heroBody:
      "Built for SMBs. Generate a professional quote, convert it to a contract, and get it accepted with e‑sign — all from your phone.",
    ctaPrimary: "Create a quote",
    ctaSecondary: "View demo",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navHelp: "Help",
    navReleaseNotes: "Release notes",
  },
  pricing: {
    title: "Pricing",
    subtitle: "Simple subscription plans for teams.",
    note: "Secure checkout with Stripe.",
  },
  subscriptionGate: {
    titleBase: "Workspace",
    titleQuote: "Quotes",
    titleContract: "Contracts",
    needAccountHeadline: "Create an account to continue",
    needAccountBody: "Sign up and sign in to access this feature.",
    expiredHeadline: "Your subscription is inactive",
    expiredBody: "Start a subscription to unlock this feature.",
    upgradeHeadline: "Upgrade required",
    upgradeBody: "Your current plan doesn’t include this feature.",
    manageSubscription: "Manage subscription",
  },
} as const;

export type Messages = typeof enUS;
