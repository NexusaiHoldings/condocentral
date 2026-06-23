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
      "subhead": "CondoCentral gives volunteer boards the tools to handle dues billing, accounting, resident communication, and state-specific compliance \u2014 for a fraction of what a management company charges. Built for communities that want to govern themselves, properly.",
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
          "value": "$40\u201380",
          "label": "per unit per month saved vs. a management company"
        },
        {
          "value": "50\u2013400",
          "label": "units \u2014 the community size CondoCentral is built for"
        },
        {
          "value": "4 states",
          "label": "FL, CA, TX, and NV compliance rules built in at launch"
        },
        {
          "value": "1 platform",
          "label": "dues, ledger, documents, and resident comms \u2014 unified"
        }
      ],
      "title": "What Self-Management Actually Saves"
    },
    {
      "type": "how_it_works",
      "steps": [
        {
          "title": "Import Your Community",
          "body": "Enter your unit roster, upload your CC&Rs and governing documents, and set your fiscal year. CondoCentral reads your documents and uses them as the authoritative source for every compliance action that follows."
        },
        {
          "title": "Set Up Dues & the Operating Ledger",
          "body": "Configure assessment schedules, late-fee rules, and reserve contributions. CondoCentral generates invoices automatically, posts payments, and keeps a clean double-entry ledger your treasurer can hand to an auditor with confidence."
        },
        {
          "title": "Communicate With Residents",
          "body": "Send meeting notices, violation letters, and budget summaries directly from the platform. Every message is logged with a timestamp, so your records are complete if a dispute ever reaches arbitration or a state agency."
        },
        {
          "title": "Stay Compliant Without a Lawyer on Retainer",
          "body": "CondoCentral's AI drafts notices, resolutions, and compliance documents grounded in your community's own CC&Rs and the statutes of your state \u2014 Florida Chapter 718, California Civil Code 4000s, Texas Property Code Chapter 204, or Nevada NRS"
        }
      ],
      "title": "From Broken Records to a Board That Runs Smoothly",
      "subhead": "Whether your management company just walked out or a dues dispute exposed gaps in your records, CondoCentral gets your community on solid footing in four deliberate steps."
    },
    {
      "type": "feature_spotlight",
      "items": [
        {
          "title": "A Ledger Your Auditor Will Respect",
          "body": "CondoCentral maintains a full double-entry general ledger behind every transaction \u2014 assessment charges, payment receipts, late fees, vendor invoices, and reserve transfers. Month-end closes produce a balance sheet and income statement formatted for HOA financials, not generic small-business bookkeeping. When a homeowner demands an accounting or a CPA comes in for the annual review, you open the l"
        },
        {
          "title": "CC&R-Grounded AI Document Drafting",
          "body": "Most HOA software gives you blank templates. CondoCentral reads your uploaded CC&Rs and uses them \u2014 alongside the statutes of your state \u2014 to draft violation notices, hearing notices, fine schedules, and board resolutions that cite the actual sections that apply to your community. The board reviews and approves; the AI does the research and the first draft. The result is documentation that holds u"
        },
        {
          "title": "Dues Billing That Runs Without a Staff Member",
          "body": "Set your assessment amounts, due dates, grace periods, and late-fee rules once. CondoCentral generates and delivers invoices on schedule, accepts ACH and card payments, posts them to the ledger automatically, and escalates overdue accounts through a configurable collections workflow \u2014 courtesy reminder, formal demand, lien-referral flag \u2014 without the board president manually tracking a spreadsheet"
        }
      ],
      "title": "The Capabilities That Keep a Self-Managed Board Credible"
    },
    {
      "type": "feature_grid",
      "features": [
        {
          "title": "Resident Portal & Communication Log",
          "body": "Homeowners view their account balance, pay dues, submit maintenance requests, and retrieve community documents through a clean resident portal. Every board-to-resident communication is logged with delivery confirmation."
        },
        {
          "title": "Meeting Management",
          "body": "Generate legally compliant meeting notices with the required notice period for your state, publish agendas, record minutes, and archive resolutions \u2014 all tied to the meeting record so your corporate book stays complete."
        },
        {
          "title": "Violation Tracking",
          "body": "Log violations with photo attachments, issue AI-drafted cure notices that cite your CC&Rs, track cure deadlines, and escalate to hearings or fines through a documented workflow that protects the board from selective-enforcement claims."
        },
        {
          "title": "Reserve Fund Accounting",
          "body": "Maintain separate reserve fund ledgers with contribution tracking and expenditure posting. CondoCentral flags when reserve draws require board approval under your governing documents or state law."
        },
        {
          "title": "Vendor & Work Order Management",
          "body": "Issue work orders, attach vendor contracts, post invoices directly to the operating ledger, and keep a full maintenance history for every common-area asset \u2014 essential when insurance claims or warranty disputes arise."
        },
        {
          "title": "State Compliance Calendar",
          "body": "A rolling compliance calendar surfaces required annual filings, budget-ratification deadlines, and election-notice windows specific to your state, so a volunteer board running on evenings and weekends doesn't miss a statutory deadline."
        }
      ],
      "title": "Everything a Self-Managed Board Needs in One Place",
      "subhead": "No add-on modules to bolt together. No management company acting as the middleman between your community and its own data."
    },
    {
      "type": "social_proof",
      "quotes": [
        {
          "quote": "We took over self-management after our management company resigned with thirty days' notice. The records they left behind were a mess. CondoCentral let us reconstruct the ledger, get dues billing running, and send a proper annual meeting notice \u2014 all before the first board meeting we ran ourselves. ",
          "author": "Board President",
          "role": "168-unit condominium association, South Florida"
        },
        {
          "quote": "The CC&R drafting tool alone is worth the subscription. We used to pay our HOA attorney $350 an hour to write violation letters. Now the board reviews a draft that already cites the right section of our declaration and the Florida statute. We still have our attorney review anything significant, but ",
          "author": "Treasurer",
          "role": "Self-managed HOA, 94 single-family homes, Central Texas"
        },
        {
          "quote": "I was skeptical that volunteer board members could handle the accounting side. But the ledger is straightforward, the month-end reports look exactly like what our CPA expects, and our delinquency rate actually went down because homeowners can see their balance and pay online any time. The management",
          "author": "Vice President & Acting Treasurer",
          "role": "220-unit planned community, Las Vegas"
        }
      ],
      "title": "What Boards Say After They Stop Paying a Management Company"
    },
    {
      "type": "faq",
      "items": [
        {
          "q": "We have no accounting background on our board. Can we really manage the financials ourselves?",
          "a": "Yes, and CondoCentral is designed for exactly that situation. The ledger uses HOA-specific terminology \u2014 operating fund, reserve fund, assessments, delinquencies \u2014 not generic accounting jargon. Transactions post automatically when dues are paid or invoices are entered. Month-end reports are formatted the way your CPA or auditor expects to see them. You don't need a bookkeeper; you need someone wi"
        },
        {
          "q": "How does the AI document drafting actually work, and is it legally reliable?",
          "a": "You upload your CC&Rs and any recorded amendments. CondoCentral indexes them and uses them \u2014 alongside the statutes for your state \u2014 as the source material when drafting violation notices, hearing notices, fine schedules, and resolutions. The AI cites the specific sections it draws from so your board can verify every reference. CondoCentral produces first drafts for board review; it does not repla"
        },
        {
          "q": "What states are supported at launch?",
          "a": "Florida (Chapter 718 condominiums and Chapter 720 homeowners associations), California (Civil Code sections 4000\u20136150), Texas (Property Code Chapter 204 and Chapter 82), and Nevada (NRS Chapter 116). State-specific compliance calendars, required notice periods, and document templates reflect the statutes in each of these states."
        },
        {
          "q": "What happens to our data if we eventually hire a management company?",
          "a": "Your data belongs to your community. You can export the full general ledger, the resident roster, all documents, and the communication history at any time in standard formats. If a new management company or a successor board needs to pick up where you left off, the records are complete and portable."
        },
        {
          "q": "How is CondoCentral priced, and is it really cheaper than a management company?",
          "a": "CondoCentral is priced as a flat monthly community subscription, with tiers based on community size. For a 100-unit community paying a management company $50 per unit per month, that's $5,000 a month \u2014 $60,000 a year. CondoCentral's subscription is a small fraction of that cost. Exact tier pricing is shown during signup; there are no per-transaction fees or setup charges."
        }
      ],
      "title": "Honest Answers to the Questions Every Board Asks"
    },
    {
      "type": "cta_band",
      "headline": "Your Community Deserves Records It Can Stand Behind",
      "subhead": "Join the boards that chose to govern their communities themselves \u2014 with the ledger, the compliance tools, and the documentation to do it right. Set up your community in under an hour."
    }
  ]
};
