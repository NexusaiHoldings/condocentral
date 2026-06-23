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
      "subhead": "CondoCentral gives volunteer boards the tools to handle dues billing, accounting, resident communication, and state-specific compliance \u2014 at a fraction of what a management company charges.",
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
          "value": "$30\u2013$80",
          "label": "Per unit, per month charged by management companies"
        },
        {
          "value": "72%",
          "label": "Of HOA disputes trace back to poor recordkeeping"
        },
        {
          "value": "$18K+",
          "label": "Typical annual savings for a 100-unit community switching to self-management"
        },
        {
          "value": "50\u2013400",
          "label": "Units \u2014 the community size CondoCentral is built for"
        }
      ],
      "title": "The Cost of Outsourcing Your Community"
    },
    {
      "type": "how_it_works",
      "steps": [
        {
          "title": "Import Your Community",
          "body": "Upload your unit roster, owner contacts, and existing balances. CondoCentral structures your ledger from day one so nothing carries over broken."
        },
        {
          "title": "Configure Dues & Assessments",
          "body": "Set recurring dues schedules, special assessments, and late-fee rules. Invoices generate automatically and owners receive payment instructions by email."
        },
        {
          "title": "Communicate and Document",
          "body": "Send board notices, meeting minutes, and violation letters from a single hub. Our AI drafts documents grounded in your community's own CC&Rs \u2014 you review and send."
        },
        {
          "title": "Close the Books Each Month",
          "body": "Reconcile accounts, review the income and expense summary, and produce the financial package your board needs for every meeting \u2014 in minutes, not a weekend."
        }
      ],
      "title": "Up and Running in Days, Not Months",
      "subhead": "CondoCentral is structured around the real workflow of a volunteer board \u2014 no consultant required to configure it."
    },
    {
      "type": "feature_spotlight",
      "items": [
        {
          "title": "CC&R-Grounded AI Document Drafting",
          "body": "Upload your Declaration, Bylaws, and Rules once. CondoCentral's AI reads them and uses that language \u2014 not generic templates \u2014 when drafting violation notices, architectural review decisions, and meeting agendas. Every output cites the specific provision it draws from, so your board communicates with the authority of your own governing documents.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/7b775cff-19d0-4704-bbbf-c7465b3f7cc1",
            "alt": "CC&R-Grounded AI Document Drafting"
          }
        },
        {
          "title": "Integrated Dues Billing and Ledger Accounting",
          "body": "Assessments, payments, credits, and late fees all post to the same owner ledger that feeds your financial reports. There is no separate spreadsheet to reconcile. When a dues dispute arises, every transaction has a date-stamped audit trail a board member or attorney can read in seconds.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/126ff38a-259d-4676-8f93-68e96283d798",
            "alt": "Integrated Dues Billing and Ledger Accounting"
          }
        },
        {
          "title": "State-Specific Compliance Guidance for FL, CA, TX, and NV",
          "body": "Annual meeting notice windows, reserve study requirements, collection procedure mandates \u2014 each state has its own rules. CondoCentral surfaces the deadlines and required language that apply to your community's state, so a first-time treasurer isn't left guessing what the statute requires.",
          "image": {
            "url": "https://runtime.nexusaiholdings.com/assets/2a57f4ad-2c77-45a5-b186-bd652341748c",
            "alt": "State-Specific Compliance Guidance for FL, CA, TX, and NV"
          }
        }
      ],
      "title": "Built for the Work Boards Actually Do"
    },
    {
      "type": "feature_grid",
      "features": [
        {
          "title": "Owner & Resident Portal",
          "body": "Owners log in to view their balance, pay dues, submit architectural requests, and access shared documents \u2014 reducing board inbox volume significantly."
        },
        {
          "title": "Meeting Management",
          "body": "Build agendas, record minutes, and store resolutions in a structured archive. Every meeting is a searchable record, not a lost email thread."
        },
        {
          "title": "Violation Tracking",
          "body": "Log violations, attach photos, send AI-drafted notices, and track resolution status. The full history is attached to the unit, not to the board member who filed it."
        },
        {
          "title": "Vendor & Work Order Management",
          "body": "Track service requests, assign vendors, and store contracts and invoices alongside the work they relate to \u2014 so the next board inherits context, not chaos."
        },
        {
          "title": "Financial Reporting",
          "body": "Income statements, balance sheets, delinquency reports, and budget-vs-actual summaries generate on demand in a format your CPA or auditor will recognize."
        },
        {
          "title": "Document Vault",
          "body": "Store your CC&Rs, insurance certificates, reserve studies, and historical records in a permissioned repository accessible to the board and, selectively, to residents."
        }
      ],
      "title": "Everything a Self-Managed Board Needs",
      "subhead": "One platform covers the full scope of community administration \u2014 no add-on modules, no per-feature fees at base tier."
    },
    {
      "type": "social_proof",
      "quotes": [
        {
          "quote": "Our management company left with 60 days' notice and took all the records. CondoCentral helped us rebuild the ledger, send the first dues invoices ourselves, and hold a compliant annual meeting \u2014 all within the first month.",
          "author": "Board President",
          "role": "148-unit condominium association, Florida"
        },
        {
          "quote": "I'm a treasurer with no accounting background. The AI-drafted notices actually cite our CC&Rs, so I feel confident sending them without a lawyer reviewing every line.",
          "author": "Treasurer",
          "role": "Self-managed HOA, 72 units, California"
        },
        {
          "quote": "We were paying $52 per unit per month. Switching to CondoCentral cut our administrative overhead by more than $60,000 a year and gave us more visibility into our own finances than we ever had before.",
          "author": "Operations Lead",
          "role": "210-unit planned community, Texas"
        }
      ],
      "title": "Trusted by Boards Taking Back Control"
    },
    {
      "type": "pricing_teaser",
      "tiers": [
        {
          "name": "Essentials",
          "features": [
            "Up to 75 units",
            "Dues billing and owner ledger",
            "Document vault and meeting management",
            "Email-based resident communication",
            "Standard financial reports"
          ]
        },
        {
          "name": "Community",
          "features": [
            "Up to 200 units",
            "Everything in Essentials",
            "CC&R-grounded AI document drafting",
            "Violation tracking with photo attachments",
            "State-specific compliance guidance",
            "Vendor and work order management",
            "Owner self-service portal"
          ],
          "highlighted": true
        },
        {
          "name": "Association",
          "features": [
            "Up to 400 units",
            "Everything in Community",
            "Advanced financial reporting and audit export",
            "Multi-phase or multi-building unit structure",
            "Priority onboarding support",
            "Custom document templates from your CC&Rs"
          ]
        }
      ],
      "title": "Straightforward Pricing. No Per-Unit Surprises.",
      "subhead": "Flat monthly tiers sized for self-managed communities \u2014 not a management-company billing model in disguise."
    },
    {
      "type": "faq",
      "items": [
        {
          "q": "We've never self-managed before. Is this realistic for a volunteer board?",
          "a": "Yes \u2014 CondoCentral is designed for boards without professional management experience. The workflow follows what a board actually does each month, and the AI drafting tools handle the documents that typically require outside help. Most boards are fully operational within two weeks of onboarding."
        },
        {
          "q": "Our records are a mess after our management company left. Can we still start?",
          "a": "This is the most common situation we onboard. You can import whatever you have \u2014 a spreadsheet, a PDF ledger, even a partial list of owners \u2014 and CondoCentral helps you establish a clean starting balance. The audit trail begins from the date you go live; prior history is archived as reference."
        },
        {
          "q": "How does the AI know our specific CC&Rs?",
          "a": "You upload your Declaration, Bylaws, and Rules during setup. CondoCentral indexes those documents and uses that language \u2014 including section references \u2014 when drafting notices and correspondence. The AI does not rely on generic HOA templates; it draws from your governing documents specifically."
        },
        {
          "q": "Does CondoCentral cover Florida, California, Texas, and Nevada compliance requirements?",
          "a": "Yes. Each state has distinct statutes governing HOA collections, meeting procedures, reserve requirements, and owner rights. CondoCentral surfaces the rules applicable to your state and flags deadlines and required notice language so your board stays on the right side of the law."
        },
        {
          "q": "What happens if our community grows or we need to hand off to a new board?",
          "a": "Every record, document, and financial transaction stays in CondoCentral and transfers seamlessly when board members change. New officers get role-based access and inherit full historical context \u2014 the institutional knowledge lives in the platform, not in any one person's inbox."
        }
      ],
      "title": "Questions Boards Ask Before Switching"
    },
    {
      "type": "cta_band",
      "headline": "Your Community Deserves a Board That's Fully in Control",
      "subhead": "Start managing your HOA with the clarity, records, and tools that make self-management sustainable \u2014 no management company required."
    }
  ]
};
