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
      "subhead": "CondoCentral gives volunteer boards the tools to handle dues billing, reserve accounting, resident communication, and state-specific compliance \u2014 all in one platform built for communities who choose to govern themselves.",
      "primaryCta": {
        "label": "Start Managing Your Community",
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
          "value": "$30\u2013$80",
          "label": "Per-unit monthly cost of a management company \u2014 eliminated"
        },
        {
          "value": "$24K+",
          "label": "Average annual savings for a 100-unit community"
        },
        {
          "value": "50\u2013400",
          "label": "Units served per community, from small condos to large subdivisions"
        },
        {
          "value": "4 states",
          "label": "FL, CA, TX, and NV compliance frameworks built in at launch"
        }
      ],
      "title": "What Boards Reclaim When They Self-Manage"
    },
    {
      "type": "how_it_works",
      "steps": [
        {
          "title": "Import Your Community",
          "body": "Upload your unit roster, existing owner records, and governing documents \u2014 your CC&Rs, bylaws, and rules. CondoCentral structures them into a living record your whole board can access."
        },
        {
          "title": "Set Up Dues and Accounting",
          "body": "Configure your assessment schedule, late-fee policy, and reserve contributions. CondoCentral generates invoices, tracks payments, and maintains a double-entry ledger that stands up to any audit."
        },
        {
          "title": "Communicate and Stay Compliant",
          "body": "Send meeting notices, violation letters, and budget disclosures that meet Florida, California, Texas, or Nevada statutory requirements \u2014 drafted by AI grounded in your own governing documents."
        },
        {
          "title": "Run Your Board with Confidence",
          "body": "Access real-time financial dashboards, delinquency reports, and a full document archive so every board member \u2014 treasurer or first-time director \u2014 always knows where the community stands."
        }
      ],
      "title": "From Broken Records to a Board That Runs Itself",
      "subhead": "Whether you just lost your management company or inherited a spreadsheet disaster after a board election, CondoCentral gets your community operational in days, not months."
    },
    {
      "type": "feature_spotlight",
      "items": [
        {
          "title": "AI Compliance Documents Grounded in Your CC&Rs",
          "body": "Most HOA software gives you generic templates. CondoCentral reads your community's actual CC&Rs and bylaws, then drafts violation notices, architectural-review decisions, and meeting agendas that cite your specific rules \u2014 not boilerplate. When state law changes in Florida or California, the AI flags which of your standing documents need updating and proposes revised language for board approval.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/62125efe-e3d9-4461-a356-fd267a6bd823",
            "alt": "AI Compliance Documents Grounded in Your CC&Rs"
          }
        },
        {
          "title": "Dues Billing and Double-Entry Accounting in One Ledger",
          "body": "Dues billing and the general ledger live in the same system, so every payment posted to an owner's account is simultaneously recorded in your operating or reserve fund \u2014 no manual reconciliation, no end-of-year surprises. Generate a bank-ready reserve-fund report, a year-end income statement, or a delinquency aging report in seconds, formatted for your state's required disclosure format.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/bc662416-811a-4700-a6a9-cd9b6cb2750a",
            "alt": "Dues Billing and Double-Entry Accounting in One Ledger"
          }
        },
        {
          "title": "Resident Communication That Builds Trust",
          "body": "Owners receive dues statements, payment confirmations, violation notices, and meeting packets through a branded community portal and email \u2014 with read receipts the board can reference in dispute resolution. When a dues dispute surfaces, the full payment history, original assessment schedule, and any board communications are in one auditable thread, not scattered across three board members' persona",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/1e9f405d-d663-4756-9f7e-20ac8ffcac8a",
            "alt": "Resident Communication That Builds Trust"
          }
        }
      ],
      "title": "The Capabilities That Replace Your Management Company"
    },
    {
      "type": "feature_grid",
      "features": [
        {
          "title": "Owner and Unit Registry",
          "body": "Maintain a complete, current record of unit ownership, mailing addresses, tenant occupancy, and contact preferences \u2014 the single source of truth your board, lenders, and title companies rely on."
        },
        {
          "title": "Assessment Scheduling",
          "body": "Configure monthly, quarterly, or annual assessments with automatic proration for mid-year closings, special assessments, and payment-plan arrangements approved by the board."
        },
        {
          "title": "Reserve Fund Tracking",
          "body": "Maintain separate operating and reserve fund balances with contribution tracking, so your community always knows its reserve-funding percentage and can answer buyer due-diligence questionnaires accurately."
        },
        {
          "title": "State-Specific Compliance Calendar",
          "body": "A rolling compliance calendar surfaces Florida HB 1021, California Civil Code, Texas PRC, and Nevada NRS deadlines \u2014 annual budget ratification, meeting notice windows, reserve study requirements \u2014 before they become violations."
        },
        {
          "title": "Document Vault",
          "body": "Store CC&Rs, bylaws, meeting minutes, financial statements, vendor contracts, and insurance certificates in a structured, searchable archive that survives board turnover and satisfies state record-retention requirements."
        },
        {
          "title": "Board Role Permissions",
          "body": "Assign treasurer, president, secretary, and read-only director roles so every board member sees what they need and nothing they shouldn't \u2014 with a full audit log of who changed what and when."
        }
      ],
      "title": "Everything a Self-Managed Board Needs, Nothing It Doesn't",
      "subhead": "Designed for volunteer treasurers and board presidents, not professional property managers."
    },
    {
      "type": "social_proof",
      "quotes": [
        {
          "quote": "We lost our management company in October with 30 days notice. CondoCentral had us billing dues and sending compliant meeting notices before the November board meeting. The treasurer role finally makes sense to me.",
          "author": "Board Treasurer",
          "role": "112-unit condominium association, Florida"
        },
        {
          "quote": "The AI pulled language directly from our CC&Rs to write the architectural denial letter. I would have spent a weekend on that. It took four minutes and cited the right section numbers.",
          "author": "Board President",
          "role": "78-unit planned community, California"
        },
        {
          "quote": "We were paying $6,200 a month to a management company that couldn't tell us our reserve balance without a three-day wait. Now I pull that number myself before every board meeting.",
          "author": "HOA President",
          "role": "230-unit townhome association, Texas"
        }
      ],
      "title": "From Boards Who Took Back Control"
    },
    {
      "type": "pricing_teaser",
      "tiers": [
        {
          "name": "Foundation",
          "features": [
            "Up to 100 units",
            "Dues billing and payment tracking",
            "Double-entry operating ledger",
            "Owner and unit registry",
            "Document vault",
            "Email resident communications",
            "Standard compliance calendar (FL, CA, TX, NV)"
          ]
        },
        {
          "name": "Steward",
          "features": [
            "Up to 250 units",
            "Everything in Foundation",
            "AI compliance document drafting grounded in your CC&Rs",
            "Reserve fund tracking and reporting",
            "Board role permissions and audit log",
            "State-specific disclosure report generation",
            "Resident community portal"
          ],
          "highlighted": true
        },
        {
          "name": "Fiduciary",
          "features": [
            "Up to 400 units",
            "Everything in Steward",
            "Special assessment scheduling and proration",
            "Multi-fund accounting (operating, reserve, special)",
            "Priority compliance calendar with statute-change alerts",
            "Dedicated onboarding for record migration",
            "Export-ready financials for CPA or attorney review"
          ]
        }
      ],
      "title": "Straightforward Pricing. No Per-Unit Surprises.",
      "subhead": "A flat community subscription \u2014 not a per-unit fee that scales against you as your community grows. Plans are sized by community, not by headcount."
    },
    {
      "type": "faq",
      "items": [
        {
          "q": "We've never self-managed before. Is this realistic for a volunteer board?",
          "a": "Yes \u2014 and CondoCentral is designed specifically for that transition. The platform guides you through setup with your existing documents, surfaces the tasks that need board attention each month, and keeps a compliance calendar so nothing statutory falls through the cracks. Most boards are fully operational within one billing cycle."
        },
        {
          "q": "How does the AI know our CC&Rs well enough to draft compliant documents?",
          "a": "When you upload your governing documents, CondoCentral indexes them and uses them as the authoritative source for any AI-drafted communication. Violation notices, architectural decisions, and rule-enforcement letters cite your specific article and section numbers \u2014 not generic language. The board always reviews and approves before anything is sent."
        },
        {
          "q": "Does CondoCentral handle Florida's new reserve-funding requirements or California's Civil Code notice rules?",
          "a": "Yes. Compliance frameworks for Florida (including post-Surfside legislation), California Civil Code, Texas Property Code, and Nevada NRS are built into the platform's document drafting, compliance calendar, and disclosure report generation. When statutes are updated, the platform flags which of your community's standing practices or documents may need board review."
        },
        {
          "q": "What happens to our records if we ever leave CondoCentral?",
          "a": "Your data belongs to your community. You can export your full owner registry, ledger history, document vault, and communication records in standard formats at any time. We don't hold your records hostage \u2014 that's the kind of behavior we exist to replace."
        },
        {
          "q": "We have a dispute with an owner over unpaid dues and years of messy records. Can CondoCentral help us untangle that?",
          "a": "CondoCentral lets you import historical payment records and reconstruct an assessment ledger from whatever starting point your records allow. Once imported, the full payment history, assessment schedule, and any board communications live in one auditable thread \u2014 exactly the documentation you need for a demand letter or small-claims proceeding."
        }
      ],
      "title": "Questions Boards Ask Before Letting Go of a Management Company"
    },
    {
      "type": "cta_band",
      "headline": "Your Community Deserves a Board That Can Actually Run It",
      "subhead": "Join the boards in Florida, California, Texas, and Nevada who chose to govern their communities with the same care and precision they bring to their own finances \u2014 without writing a check to a management company every month."
    }
  ]
};
