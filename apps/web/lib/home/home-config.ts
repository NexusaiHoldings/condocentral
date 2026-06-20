/**
 * home-config — the company's root surface (company-root-landing-001).
 * Written by provisioning (_step_substrate_install) from CTO home_mode
 * + CMO positioning. Do NOT hand-edit.
 */
export interface HomeCta {
  label: string;
  href: string;
}

export interface HomeConfig {
  mode: "landing" | "conversation";
  headline?: string;
  subhead?: string;
  primaryCta?: HomeCta;
  secondaryCta?: HomeCta;
}

export const homeConfig: HomeConfig = {
  "mode": "landing",
  "headline": "Run Your HOA Without a Management Company \u2014 No Expertise Required.",
  "subhead": "CondoCentral (getcondocentral.com) is the only HOA management platform built exclusively for volunteer board members \u2014 not professional property managers \u2014 combining AI-assisted compliance workflows, dues billing, and resident communication"
};
