/** home-config — provisioning-owned (homepage-content-001). Do NOT hand-edit. */
export interface HomeCta { label: string; href: string; }
export interface HomeFeature { title: string; body: string; }
export interface HomeConfig {
  mode: "landing" | "conversation";
  headline?: string;
  subhead?: string;
  primaryCta?: HomeCta;
  secondaryCta?: HomeCta;
  featuresTitle?: string;
  features?: HomeFeature[];
  closingHeadline?: string;
}

export const homeConfig: HomeConfig = {
  "headline": "Run Your HOA Without the Management Company",
  "subhead": "CondoCentral gives volunteer HOA boards in Florida, California, Texas, and Nevada everything they need to handle dues billing, accounting, resident communication, and state-specific compliance \u2014 without paying $30\u201380 per unit per month to a management company.",
  "featuresTitle": "Everything your board needs to govern with confidence",
  "features": [
    {
      "title": "Dues billing and collections",
      "body": "Automatically generate and send dues invoices, track payments, and flag delinquencies \u2014 so your treasurer spends minutes on billing, not weekends."
    },
    {
      "title": "Community accounting and ledgers",
      "body": "Maintain a clean, auditable general ledger with reserve tracking and budget-vs-actual reporting that any board member or auditor can read at a glance."
    },
    {
      "title": "AI-drafted compliance documents",
      "body": "Generate violation notices, meeting minutes, and state-required disclosures grounded in your community's own CC&Rs \u2014 reviewed by AI so nothing conflicts with your governing documents."
    },
    {
      "title": "Resident communication hub",
      "body": "Send announcements, post community documents, and manage owner records in one organized portal so every resident stays informed and every message is on the record."
    }
  ],
  "closingHeadline": "Your community deserves order, fairness, and a board that isn't burned out \u2014 CondoCentral makes that possible",
  "mode": "landing"
};
