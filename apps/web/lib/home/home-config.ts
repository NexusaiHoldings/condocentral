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
  "headline": "Run Your HOA Without a $30-80/Unit Management Company",
  "subhead": "CondoCentral gives volunteer HOA boards in Florida, California, Texas, and Nevada everything they need to self-manage dues billing, accounting, resident communication, and state-specific compliance \u2014 without the five-figure management fees.",
  "featuresTitle": "Everything your board needs to self-manage",
  "features": [
    {
      "title": "Automated Dues Billing and Collection",
      "body": "Send dues invoices, track payments, and flag delinquencies automatically so your treasurer spends minutes per month \u2014 not weekends \u2014 keeping the books straight."
    },
    {
      "title": "HOA Accounting Built for Boards",
      "body": "Track operating budgets under $300K with a chart of accounts designed for community associations, giving your board audit-ready financials without hiring an outside bookkeeper."
    },
    {
      "title": "AI-Drafted Compliance Documents",
      "body": "Generate violation notices, meeting minutes, and state-required disclosures using AI trained on your community's own CC&Rs and the laws of your state, so every document holds up legally."
    },
    {
      "title": "Resident Communication and Records Hub",
      "body": "Send announcements, manage owner contact records, and store governing documents in one place so new board members inherit clean, complete records \u2014 not a broken spreadsheet."
    }
  ],
  "closingHeadline": "Your community deserves great management \u2014 you can do it yourself",
  "mode": "landing"
};
