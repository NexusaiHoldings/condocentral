/**
 * home-config — chooses the company's root surface (company-root-landing-001).
 *
 * mode "landing"      → root renders a themed marketing page (<Landing>): hero +
 *                       feature sections + closing CTA. The conversation surface
 *                       lives at /assistant.
 * mode "conversation" → root renders the §6.1 ConversationSurface (chat-first
 *                       products); /assistant mirrors it.
 *
 * DEFAULT below is a generic landing so an undecided company still gets a real
 * front door. At provisioning, the engine OVERWRITES this whole file from the
 * homepage content generator (headline/subhead/features/CTA, grounded in the
 * plan). Do NOT hand-edit in a company repo — it's provisioning-owned.
 */
export interface HomeCta {
  label: string;
  href: string;
}

/** A feature / value block rendered in the landing page's section grid. */
export interface HomeFeature {
  title: string;
  body: string;
}

/* ── Bespoke composition (homepage-composition-001) ────────────────────────────
 * A homepage is an ORDERED sequence of section blocks. The composer agent picks
 * which sections a company gets and in what order, and writes each section's
 * content from the plan/brand — so a marketplace, a compliance SaaS, and a dev
 * tool get genuinely different pages, all from one vetted, theme-aware component
 * library (build-safe, every company still inherits substrate upgrades).
 *
 * Each section is a discriminated union on `type`. Landing.tsx maps type →
 * component. Unknown types are skipped (forward-compatible). When `sections` is
 * absent, Landing falls back to the legacy headline/subhead/features/closing
 * rendering, so existing companies are unaffected. */
export interface SectionImage {
  /** Public image URL, OR the literal "hero_image" to resolve from site_media. */
  url?: string;
  alt?: string;
  caption?: string;
}

export interface HeroSection {
  type: "hero";
  eyebrow?: string;
  headline: string;
  subhead?: string;
  primaryCta?: HomeCta;
  secondaryCta?: HomeCta;
  image?: SectionImage; // omit/"hero_image" → resolved from site_media at render
}
export interface StatsSection {
  type: "stats";
  title?: string;
  stats: { value: string; label: string }[];
}
export interface HowItWorksSection {
  type: "how_it_works";
  title?: string;
  subhead?: string;
  steps: { title: string; body: string }[];
}
export interface FeatureGridSection {
  type: "feature_grid";
  title?: string;
  subhead?: string;
  features: HomeFeature[];
}
export interface FeatureSpotlightSection {
  type: "feature_spotlight";
  title?: string;
  items: { title: string; body: string; image?: SectionImage }[];
}
export interface SocialProofSection {
  type: "social_proof";
  title?: string;
  quotes: { quote: string; author?: string; role?: string }[];
}
export interface FaqSection {
  type: "faq";
  title?: string;
  items: { q: string; a: string }[];
}
export interface PricingTeaserSection {
  type: "pricing_teaser";
  title?: string;
  subhead?: string;
  tiers: {
    name: string;
    price?: string;
    period?: string;
    features: string[];
    cta?: HomeCta;
    highlighted?: boolean;
  }[];
}
export interface GallerySection {
  type: "gallery";
  title?: string;
  images: SectionImage[];
}
export interface CtaBandSection {
  type: "cta_band";
  headline: string;
  subhead?: string;
  cta?: HomeCta;
}

export type HomeSection =
  | HeroSection
  | StatsSection
  | HowItWorksSection
  | FeatureGridSection
  | FeatureSpotlightSection
  | SocialProofSection
  | FaqSection
  | PricingTeaserSection
  | GallerySection
  | CtaBandSection;

export interface HomeConfig {
  mode: "landing" | "conversation";
  /** Bespoke section sequence (composer-generated). When present, Landing
   *  renders these in order and ignores the legacy fields below. */
  sections?: HomeSection[];

  // ── Legacy single-layout fields (fallback when `sections` is absent) ──
  headline?: string;
  subhead?: string;
  primaryCta?: HomeCta;
  secondaryCta?: HomeCta;
  /** Section heading above the feature grid (e.g. "Why teams choose us"). */
  featuresTitle?: string;
  /** 3-6 feature/value blocks. Rendered as a responsive card grid. */
  features?: HomeFeature[];
  /** Closing CTA band headline beneath the features. */
  closingHeadline?: string;
}

export const homeConfig: HomeConfig = {
  "mode": "landing",
  "sections": [
    {
      "type": "hero",
      "headline": "Run Your HOA Without a Management Company",
      "eyebrow": "Self-Managed HOA Software",
      "subhead": "CondoCentral gives volunteer boards the tools to handle dues billing, community accounting, resident communication, and state-specific compliance \u2014 all in one place, at a fraction of the cost.",
      "primaryCta": {
        "label": "Start Managing Free",
        "href": "/signup"
      },
      "secondaryCta": {
        "label": "See How It Works",
        "href": "#how-it-works"
      },
      "image": {
        "url": "hero_image"
      }
    },
    {
      "type": "stats",
      "stats": [
        {
          "value": "$30\u201380",
          "label": "Per unit, per month charged by management companies"
        },
        {
          "value": "$0 extra",
          "label": "Per-unit fee on CondoCentral's flat community plan"
        },
        {
          "value": "4 states",
          "label": "FL, CA, TX, and NV compliance rules built in at launch"
        },
        {
          "value": "50\u2013400",
          "label": "Units supported \u2014 right-sized for self-managed communities"
        }
      ],
      "title": "The Cost of Doing Nothing Has a Number"
    },
    {
      "type": "how_it_works",
      "steps": [
        {
          "title": "Import Your Community",
          "body": "Upload your unit roster, existing balances, and CC&Rs. CondoCentral structures your records into a clean, auditable ledger from day one."
        },
        {
          "title": "Configure Dues & Assessments",
          "body": "Set recurring dues schedules, late-fee rules, and special assessments. Invoices go out automatically; payments post to the ledger in real time."
        },
        {
          "title": "Communicate With Residents",
          "body": "Send notices, meeting agendas, and violation letters through the resident portal. Every message is logged and timestamped for your records."
        },
        {
          "title": "Stay Compliant, Automatically",
          "body": "Our AI drafts state-specific notices and resolutions grounded in your own CC&Rs \u2014 so your documents are always consistent with your governing documents and local statute."
        }
      ],
      "title": "From Broken Records to Confident Board in Four Steps",
      "subhead": "Whether your management company just left or your last treasurer kept everything in a spreadsheet, CondoCentral gets you operational fast."
    },
    {
      "type": "feature_spotlight",
      "items": [
        {
          "title": "A Ledger Your Auditor Will Actually Trust",
          "body": "Every dues payment, late fee, special assessment, and expense posts to a double-entry accounting ledger with a full audit trail. Generate an income statement, balance sheet, or delinquency report in seconds \u2014 no spreadsheets, no reconciliation surprises at year-end.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/524cfccf-ec5e-4998-b3b3-c6fdd063dd6e",
            "alt": "A Ledger Your Auditor Will Actually Trust"
          }
        },
        {
          "title": "AI Compliance Documents Grounded in Your CC&Rs",
          "body": "Upload your Declaration, Bylaws, and Rules. When you need a violation notice, meeting notice, or board resolution, CondoCentral's AI drafts it using the exact language and timelines your governing documents require \u2014 then cross-checks against Florida, California, Texas, or Nevada statute before you send.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/1b87fcf7-211e-44f2-a2f2-b92667faf885",
            "alt": "AI Compliance Documents Grounded in Your CC&Rs"
          }
        },
        {
          "title": "Resident Portal That Ends the Email Chaos",
          "body": "Owners log in to view their account balance, pay dues by ACH or card, access meeting minutes, and submit maintenance requests. Boards see everything in one dashboard \u2014 no more chasing payments over text or fielding the same question twelve times.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/6a263556-d1b7-4635-9846-241de5613af9",
            "alt": "Resident Portal That Ends the Email Chaos"
          }
        }
      ],
      "title": "The Capabilities That Replace a Management Company"
    },
    {
      "type": "feature_grid",
      "features": [
        {
          "title": "Automated Dues Billing",
          "body": "Recurring invoices, payment reminders, and late fees run on schedule without board intervention."
        },
        {
          "title": "Delinquency Tracking",
          "body": "See every past-due account at a glance, with a timestamped history of every notice sent and payment received."
        },
        {
          "title": "Operating & Reserve Budgets",
          "body": "Build your annual budget inside CondoCentral and compare actuals to plan every month."
        },
        {
          "title": "Document Vault",
          "body": "Store CC&Rs, meeting minutes, insurance certificates, and vendor contracts in a searchable, permission-controlled library."
        },
        {
          "title": "Meeting Management",
          "body": "Draft agendas, record minutes, and publish approved documents to the resident portal \u2014 all linked to the meeting record."
        },
        {
          "title": "Maintenance Request Tracking",
          "body": "Residents submit requests through the portal; the board assigns, tracks, and closes them with a full communication log."
        }
      ],
      "title": "Everything a Board Needs, Nothing You Don't",
      "subhead": "Built for the volunteer treasurer juggling this on a Tuesday night, not a credentialed property manager with a full staff."
    },
    {
      "type": "social_proof",
      "quotes": [
        {
          "quote": "Our management company left with 90 days' notice and our records were a mess. CondoCentral had us billing dues and sending compliant notices within a week. I can't believe we ever paid $55 a unit for what we now do ourselves.",
          "author": "Board President",
          "role": "112-unit condominium association, South Florida"
        },
        {
          "quote": "As treasurer, I was terrified of the accounting. The ledger is straightforward enough that I can close the month myself and hand the auditor a real report. That alone is worth the subscription.",
          "author": "HOA Treasurer",
          "role": "78-unit planned community, Austin, TX"
        },
        {
          "quote": "The CC&R-grounded violation letters stopped our dues disputes cold. Residents can't argue with their own governing documents, and every letter is logged so we have a clean paper trail.",
          "author": "Board Secretary",
          "role": "204-unit homeowners association, Las Vegas, NV"
        }
      ],
      "title": "Boards Who Took Back Control"
    },
    {
      "type": "pricing_teaser",
      "tiers": [
        {
          "name": "Essentials",
          "features": [
            "Up to 100 units",
            "Dues billing & payment collection",
            "Resident portal & communications",
            "Document vault",
            "Standard financial reports"
          ]
        },
        {
          "name": "Community",
          "features": [
            "Up to 250 units",
            "Everything in Essentials",
            "Full double-entry accounting ledger",
            "AI compliance document drafting (FL, CA, TX, NV)",
            "Budget vs. actuals tracking",
            "Maintenance request management"
          ],
          "highlighted": true
        },
        {
          "name": "Association",
          "features": [
            "Up to 400 units",
            "Everything in Community",
            "Priority support & onboarding session",
            "Multi-board user roles & permissions",
            "Annual audit export package"
          ]
        }
      ],
      "title": "Flat Community Pricing \u2014 No Per-Unit Surprises",
      "subhead": "One predictable monthly subscription covers your entire community. No setup fees, no per-unit overage, no long-term contract."
    },
    {
      "type": "faq",
      "items": [
        {
          "q": "We've never self-managed before. Is this realistic for a volunteer board?",
          "a": "Yes \u2014 CondoCentral is designed for exactly that transition. The onboarding flow walks you through importing your roster and opening balances, and the AI compliance tools handle the state-law complexity that makes self-management feel risky. Most boards are billing dues within a week of signing up."
        },
        {
          "q": "How does the AI know our specific CC&Rs?",
          "a": "You upload your Declaration, Bylaws, and Rules during setup. The AI reads and indexes your governing documents, then uses them as the primary source when drafting notices and resolutions \u2014 so the language is consistent with your documents, not a generic template."
        },
        {
          "q": "Is CondoCentral compliant with Florida, California, Texas, and Nevada HOA law?",
          "a": "State-specific statutory requirements for notice periods, meeting procedures, and collection rules are built into the platform for all four states at launch. The AI cross-references your documents against current statute before generating any compliance output. We update the rule sets when statutes change."
        },
        {
          "q": "What happens to our data if we ever leave?",
          "a": "Your records are yours. You can export the full accounting ledger, document vault, and resident history at any time in standard formats. We don't hold your data hostage \u2014 a clean exit is part of the trust we're building."
        },
        {
          "q": "Can residents pay dues online, or do we still collect checks?",
          "a": "Residents pay by ACH bank transfer or credit card through the resident portal. Payments post to the ledger automatically and trigger a receipt. Boards can still record manual check payments for owners who prefer it."
        }
      ],
      "title": "Questions Boards Ask Before Signing Up"
    },
    {
      "type": "cta_band",
      "headline": "Your Community Deserves Books You Can Stand Behind",
      "subhead": "Join the boards that stopped paying management-company margins and started running their communities with clarity, confidence, and control."
    }
  ]
};
