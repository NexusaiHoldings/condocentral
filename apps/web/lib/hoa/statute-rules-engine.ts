export type HoaState = "FL" | "CA" | "TX" | "NV";

export type ComplianceCategory =
  | "notice_period"
  | "disclosure"
  | "meeting_frequency"
  | "record_keeping"
  | "financial"
  | "election"
  | "enforcement";

export type ComplianceStatus =
  | "compliant"
  | "non_compliant"
  | "not_addressed"
  | "pending_review";

export interface StatuteRule {
  id: string;
  state: HoaState;
  code: string;
  title: string;
  category: ComplianceCategory;
  description: string;
  requirement: string;
  penaltyForNonCompliance: string;
  noticePeriodDays?: number;
  meetingFrequencyPerYear?: number;
  effectiveDate: string;
}

export interface ExtractedDocRule {
  ruleType: string;
  description: string;
  value?: string;
  periodDays?: number;
  applicableParties: string[];
  sourceSection?: string;
  confidence: number;
}

export interface ComplianceItem {
  rule: StatuteRule;
  status: ComplianceStatus;
  currentValue?: string;
  requiredValue: string;
  gap?: string;
  recommendation: string;
}

export interface ComplianceReport {
  state: HoaState;
  analysedAt: string;
  documentSource?: string;
  items: ComplianceItem[];
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    notAddressed: number;
    pendingReview: number;
  };
}

const STATE_STATUTES: StatuteRule[] = [
  // === FLORIDA (Chapter 720, Florida Statutes) ===
  {
    id: "FL-720.303-2",
    state: "FL",
    code: "Fla. Stat. § 720.303(2)",
    title: "Annual Meeting Requirement",
    category: "meeting_frequency",
    description: "An association must hold a meeting of members at least once a year for the purpose of electing directors and transacting other business.",
    requirement: "Hold at least one annual meeting per year",
    penaltyForNonCompliance: "Association members may petition for court-ordered meeting",
    meetingFrequencyPerYear: 1,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.303-2a",
    state: "FL",
    code: "Fla. Stat. § 720.303(2)(a)",
    title: "Board and Annual Meeting Notice Period",
    category: "notice_period",
    description: "Board meetings must be noticed at least 48 hours in advance; annual and special meetings require at least 14 days advance written notice.",
    requirement: "Provide 14 days advance written notice for annual and special meetings; 48 hours for regular board meetings",
    penaltyForNonCompliance: "Actions taken at improperly noticed meetings may be voidable",
    noticePeriodDays: 14,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.303-4",
    state: "FL",
    code: "Fla. Stat. § 720.303(4)",
    title: "Records Inspection Availability",
    category: "record_keeping",
    description: "The association must make official records available to members within 10 business days after receipt of a written request.",
    requirement: "Provide record access within 10 business days of written request",
    penaltyForNonCompliance: "$50 per day fine for failure to provide records, up to $200 total",
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.303-5",
    state: "FL",
    code: "Fla. Stat. § 720.303(5)",
    title: "Annual Financial Statements",
    category: "financial",
    description: "Annual financial statements must be prepared and provided to all members within 90 days of the fiscal year end.",
    requirement: "Provide annual financial statements to members within 90 days of fiscal year end",
    penaltyForNonCompliance: "Association directors may face personal liability for willful failure",
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.303-6",
    state: "FL",
    code: "Fla. Stat. § 720.303(6)",
    title: "Budget Approval and Ratification",
    category: "financial",
    description: "A proposed annual budget must be delivered to all members at least 14 days before the meeting at which it will be considered.",
    requirement: "Deliver proposed annual budget to members at least 14 days before budget ratification meeting",
    penaltyForNonCompliance: "Prior year budget remains in effect until properly ratified budget is adopted",
    noticePeriodDays: 14,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.306-1a",
    state: "FL",
    code: "Fla. Stat. § 720.306(1)(a)",
    title: "Meeting Quorum Requirement",
    category: "meeting_frequency",
    description: "Unless otherwise provided in the bylaws, a quorum is 30% of the total voting interests.",
    requirement: "Quorum of at least 30% of total voting interests unless bylaws specify otherwise",
    penaltyForNonCompliance: "Meeting cannot conduct business without quorum; must be adjourned",
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.306-9",
    state: "FL",
    code: "Fla. Stat. § 720.306(9)",
    title: "Election Ballot and Notice Period",
    category: "election",
    description: "The association must mail or electronically send ballots to all eligible voters at least 14 days before the annual meeting.",
    requirement: "Send election ballots and notice at least 14 days before annual meeting",
    penaltyForNonCompliance: "Election may be invalidated; new election may be court-ordered",
    noticePeriodDays: 14,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.308",
    state: "FL",
    code: "Fla. Stat. § 720.308",
    title: "Assessment Notice Requirement",
    category: "notice_period",
    description: "Before collecting assessments, the association must provide proper notice including the amount, due date, and consequences of non-payment.",
    requirement: "Provide written assessment notice at least 30 days before due date",
    penaltyForNonCompliance: "Assessment lien may be challenged if proper notice was not given",
    noticePeriodDays: 30,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.3085",
    state: "FL",
    code: "Fla. Stat. § 720.3085",
    title: "Lien Notice Before Recording",
    category: "enforcement",
    description: "The association must provide at least 45 days written notice before recording a claim of lien for unpaid assessments.",
    requirement: "Provide 45 days written notice before recording claim of lien",
    penaltyForNonCompliance: "Lien may be invalid if proper notice was not given",
    noticePeriodDays: 45,
    effectiveDate: "2023-01-01",
  },
  {
    id: "FL-720.311",
    state: "FL",
    code: "Fla. Stat. § 720.311",
    title: "Pre-Suit Dispute Resolution",
    category: "enforcement",
    description: "Before filing a lawsuit, parties must attempt to resolve disputes through pre-suit mediation or mandatory non-binding arbitration.",
    requirement: "Offer pre-suit mediation for disputes before initiating litigation",
    penaltyForNonCompliance: "Court may sanction party that fails to participate in required pre-suit process",
    effectiveDate: "2023-01-01",
  },

  // === CALIFORNIA (Davis-Stirling Common Interest Development Act) ===
  {
    id: "CA-Civil-4920",
    state: "CA",
    code: "Cal. Civil Code § 4920",
    title: "Board Meeting Notice Period",
    category: "notice_period",
    description: "General notice of board meetings must be provided at least 4 days before the meeting by posting in a prominent location and delivery to any member who requests notice.",
    requirement: "Post general notice of board meetings at least 4 days before meeting date",
    penaltyForNonCompliance: "Actions taken at improperly noticed meetings may be challenged and voided",
    noticePeriodDays: 4,
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-4925",
    state: "CA",
    code: "Cal. Civil Code § 4925",
    title: "Open Board Meeting Requirement",
    category: "meeting_frequency",
    description: "All board meetings must be open to all members, with limited exceptions for executive session matters such as litigation, personnel, and contract negotiations.",
    requirement: "Allow all members to attend all board meetings except authorized executive sessions",
    penaltyForNonCompliance: "Members can seek court order to enforce open meeting rights",
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5000",
    state: "CA",
    code: "Cal. Civil Code § 5000",
    title: "Annual Member Meeting Requirement",
    category: "meeting_frequency",
    description: "An association must conduct director elections at least once every four years by secret ballot unless governing documents provide for more frequent elections.",
    requirement: "Hold director elections at least once every 4 years; annual meetings per governing documents",
    penaltyForNonCompliance: "Members may petition superior court to order election",
    meetingFrequencyPerYear: 1,
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5110",
    state: "CA",
    code: "Cal. Civil Code § 5110",
    title: "Independent Inspector of Elections",
    category: "election",
    description: "All elections and member votes must be conducted with one or three independent third-party inspectors of elections.",
    requirement: "Appoint independent third-party inspector(s) of elections for all member votes",
    penaltyForNonCompliance: "Election results may be challenged and voided by court order",
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5210",
    state: "CA",
    code: "Cal. Civil Code § 5210",
    title: "Records Inspection Timeline",
    category: "record_keeping",
    description: "The association must provide requested records within 10 business days of receipt of written request from a member.",
    requirement: "Provide requested records within 10 business days of written request",
    penaltyForNonCompliance: "$500 civil penalty per violation; award of attorney fees if member prevails",
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5300",
    state: "CA",
    code: "Cal. Civil Code § 5300",
    title: "Annual Budget Report Distribution",
    category: "financial",
    description: "The association must distribute a comprehensive annual budget report and policy statement to all members 30 to 90 days before the end of the current fiscal year.",
    requirement: "Distribute annual budget report 30-90 days before fiscal year end",
    penaltyForNonCompliance: "Failure may result in member litigation and court-ordered compliance",
    noticePeriodDays: 30,
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5550",
    state: "CA",
    code: "Cal. Civil Code § 5550",
    title: "Reserve Study Requirement",
    category: "financial",
    description: "The association must cause a study of the reserve account requirements to be conducted at least every three years by a qualified professional and perform an annual update.",
    requirement: "Complete full reserve study every 3 years; perform annual update review",
    penaltyForNonCompliance: "Board members may face personal liability; members may demand compliance",
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5660",
    state: "CA",
    code: "Cal. Civil Code § 5660",
    title: "Pre-Lien Delinquency Notice",
    category: "enforcement",
    description: "Before recording a lien, the association must send a pre-lien notice to the delinquent owner at least 30 days before recording the lien.",
    requirement: "Send pre-lien delinquency notice at least 30 days before recording lien",
    penaltyForNonCompliance: "Lien is invalid and unenforceable if proper pre-lien notice was not given",
    noticePeriodDays: 30,
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-4040",
    state: "CA",
    code: "Cal. Civil Code § 4040",
    title: "Annual Required Member Disclosures",
    category: "disclosure",
    description: "The association must provide members with a comprehensive package of annual disclosures including financial statements, insurance summary, assessment information, and governing documents.",
    requirement: "Distribute annual disclosure package to all members before end of each fiscal year",
    penaltyForNonCompliance: "Member may seek injunctive relief and compensatory damages",
    effectiveDate: "2023-01-01",
  },
  {
    id: "CA-Civil-5650",
    state: "CA",
    code: "Cal. Civil Code § 5650",
    title: "Assessment Delinquency Collection Notice",
    category: "notice_period",
    description: "Before beginning collections, the association must send a compliant delinquency notice including the right to request a payment plan and dispute resolution.",
    requirement: "Send compliant delinquency notice before initiating any collection proceedings",
    penaltyForNonCompliance: "Collection action may be voided for improper or missing notice",
    effectiveDate: "2023-01-01",
  },

  // === TEXAS (Chapter 209, Texas Property Code) ===
  {
    id: "TX-209.004",
    state: "TX",
    code: "Tex. Prop. Code § 209.004",
    title: "Board Meeting Notice Requirement",
    category: "notice_period",
    description: "Board meetings must be noticed at least 72 hours in advance by posting at a location designated in governing documents or at the community entrance.",
    requirement: "Post meeting notice at least 72 hours before board meeting with date, time, place, and agenda",
    penaltyForNonCompliance: "Actions taken at improperly noticed meetings may be challenged in court",
    noticePeriodDays: 3,
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.005",
    state: "TX",
    code: "Tex. Prop. Code § 209.005",
    title: "Owner Records Inspection Right",
    category: "record_keeping",
    description: "Property owners have the right to inspect and copy all books and records of the association within 10 business days of a written request.",
    requirement: "Make records available within 10 business days of written request; may charge reasonable copy fees",
    penaltyForNonCompliance: "Association may be liable for owner's attorney fees and court costs",
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.0051",
    state: "TX",
    code: "Tex. Prop. Code § 209.0051",
    title: "Annual Member Meeting Requirement",
    category: "meeting_frequency",
    description: "A property owners association must hold an annual meeting of property owners to elect board members and conduct association business.",
    requirement: "Hold annual member meeting for board elections and general business",
    penaltyForNonCompliance: "Members may petition court to order election and meeting",
    meetingFrequencyPerYear: 1,
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.006",
    state: "TX",
    code: "Tex. Prop. Code § 209.006",
    title: "Assessment Enforcement Notice",
    category: "notice_period",
    description: "Before initiating enforcement action for delinquent assessments, the association must provide at least 30 days written notice by certified mail.",
    requirement: "Provide 30 days certified mail written notice before beginning collection enforcement",
    penaltyForNonCompliance: "Enforcement action may be voided for lack of required notice",
    noticePeriodDays: 30,
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.007",
    state: "TX",
    code: "Tex. Prop. Code § 209.007",
    title: "Enforcement Hearing Right",
    category: "enforcement",
    description: "Before imposing a fine or suspending a privilege for a violation, the association must provide the owner the opportunity to appear at a hearing before the board.",
    requirement: "Provide opportunity for owner hearing before imposing fines or suspending privileges",
    penaltyForNonCompliance: "Fine or suspension may be invalidated; association may be liable for attorney fees",
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.0058",
    state: "TX",
    code: "Tex. Prop. Code § 209.0058",
    title: "Election Notice Period",
    category: "election",
    description: "Notice of an annual meeting to elect board members must be provided at least 10 days but not more than 60 days before the meeting.",
    requirement: "Provide election meeting notice 10-60 days before the election meeting",
    penaltyForNonCompliance: "Election may be invalidated; new election may be court-ordered",
    noticePeriodDays: 10,
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.0064",
    state: "TX",
    code: "Tex. Prop. Code § 209.0064",
    title: "Reserve Fund Policy",
    category: "financial",
    description: "A property owners association must adopt and maintain a reserve fund policy for the repair and replacement of major components if required by governing documents.",
    requirement: "Adopt and maintain reserve fund policy as required by governing documents",
    penaltyForNonCompliance: "Board members may face personal liability for failure to maintain adequate reserves",
    effectiveDate: "2023-01-01",
  },
  {
    id: "TX-209.016",
    state: "TX",
    code: "Tex. Prop. Code § 209.016",
    title: "Resale Certificate Disclosure",
    category: "disclosure",
    description: "The association must provide a resale certificate to a purchaser within 7 days of request containing assessment amounts, violation history, and pending litigation.",
    requirement: "Provide resale certificate within 7 days of request with all required disclosures",
    penaltyForNonCompliance: "Association may be liable to purchaser for damages caused by omission or error",
    effectiveDate: "2023-01-01",
  },

  // === NEVADA (Chapter 116, Nevada Revised Statutes) ===
  {
    id: "NV-116.31083-notice",
    state: "NV",
    code: "NRS § 116.31083(1)",
    title: "Board Meeting Notice Requirement",
    category: "notice_period",
    description: "The executive board must notify unit owners of each meeting of the executive board at least 10 days before the meeting.",
    requirement: "Provide at least 10 days advance notice of executive board meetings to all unit owners",
    penaltyForNonCompliance: "Actions taken without proper notice may be challenged; Nevada Real Estate Division may investigate",
    noticePeriodDays: 10,
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.31083-annual",
    state: "NV",
    code: "NRS § 116.31083",
    title: "Annual Member Meeting Requirement",
    category: "meeting_frequency",
    description: "The association must hold an annual meeting of the units' owners for election of directors and general business.",
    requirement: "Hold annual meeting of unit owners each year",
    penaltyForNonCompliance: "Unit owners may petition for court-ordered meeting; Nevada Real Estate Division oversight",
    meetingFrequencyPerYear: 1,
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.31085",
    state: "NV",
    code: "NRS § 116.31085",
    title: "Records Inspection Timeline",
    category: "record_keeping",
    description: "The association must make financial records and other books available for inspection and copying within 14 calendar days of a written request.",
    requirement: "Provide records within 14 calendar days of written request; may charge reasonable copy fees",
    penaltyForNonCompliance: "$500 civil penalty per violation plus mandatory attorney fees",
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.3115",
    state: "NV",
    code: "NRS § 116.3115",
    title: "Reserve Fund Requirement",
    category: "financial",
    description: "The association must establish and maintain a reserve fund for the repair, replacement, and restoration of major components, funded at an adequate level based on a reserve study.",
    requirement: "Maintain reserve fund with adequate funding; complete reserve study every 5 years",
    penaltyForNonCompliance: "Board members may face personal liability; Nevada Real Estate Division may impose penalties",
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.31162",
    state: "NV",
    code: "NRS § 116.31162",
    title: "Delinquency Notice Before Lien",
    category: "enforcement",
    description: "Before recording a lien for delinquent assessments, the association must provide at least 30 days written notice to the unit owner.",
    requirement: "Send 30 days advance written notice to unit owner before recording delinquency lien",
    penaltyForNonCompliance: "Lien may be invalid and unenforceable; association may face damages",
    noticePeriodDays: 30,
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.31034",
    state: "NV",
    code: "NRS § 116.31034",
    title: "Election Notice Period",
    category: "election",
    description: "Notice of any meeting at which elections will be held must be provided to all unit owners at least 15 days before the meeting.",
    requirement: "Provide election notice at least 15 days before election meeting",
    penaltyForNonCompliance: "Election results may be challenged and invalidated by court or Real Estate Division",
    noticePeriodDays: 15,
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.4109",
    state: "NV",
    code: "NRS § 116.4109",
    title: "Disclosure to Purchasers (Resale Package)",
    category: "disclosure",
    description: "The association must provide a resale disclosure package to purchasers within 10 days of request, containing required disclosures about assessments, violations, pending litigation, and reserves.",
    requirement: "Provide resale disclosure package within 10 days of purchaser's written request",
    penaltyForNonCompliance: "Purchaser may rescind the contract within 5 days of receiving disclosures if not timely provided",
    effectiveDate: "2023-01-01",
  },
  {
    id: "NV-116.31152",
    state: "NV",
    code: "NRS § 116.31152",
    title: "Hearing Right Before Fine",
    category: "enforcement",
    description: "Before imposing a fine for a violation, the association must provide the unit owner with written notice and an opportunity for a hearing before the executive board.",
    requirement: "Provide written notice and hearing opportunity before imposing any fine",
    penaltyForNonCompliance: "Fine may be invalidated; association may face liability for improper enforcement",
    effectiveDate: "2023-01-01",
  },
];

export function getStatutesByState(state: HoaState): StatuteRule[] {
  return STATE_STATUTES.filter((s) => s.state === state);
}

export function getAllStatutes(): StatuteRule[] {
  return [...STATE_STATUTES];
}

export function getStatuteById(id: string): StatuteRule | undefined {
  return STATE_STATUTES.find((s) => s.id === id);
}

export function mapExtractedRulesToStatutes(
  extractedRules: ExtractedDocRule[],
  state: HoaState,
): ComplianceReport {
  const applicableStatutes = getStatutesByState(state);
  const now = new Date().toISOString();

  const items: ComplianceItem[] = applicableStatutes.map((statute) => {
    const matchingRules = extractedRules.filter((rule) => {
      const ruleTypeLower = rule.ruleType.toLowerCase();
      const descLower = rule.description.toLowerCase();
      switch (statute.category) {
        case "notice_period":
          return ruleTypeLower.includes("notice") || descLower.includes("notice");
        case "meeting_frequency":
          return ruleTypeLower.includes("meeting") || descLower.includes("meeting") || descLower.includes("annual");
        case "record_keeping":
          return ruleTypeLower.includes("record") || descLower.includes("record") || descLower.includes("inspection");
        case "financial":
          return (
            ruleTypeLower.includes("financial") ||
            ruleTypeLower.includes("budget") ||
            ruleTypeLower.includes("reserve") ||
            descLower.includes("financial") ||
            descLower.includes("budget")
          );
        case "election":
          return ruleTypeLower.includes("election") || ruleTypeLower.includes("vote") || descLower.includes("election") || descLower.includes("ballot");
        case "enforcement":
          return (
            ruleTypeLower.includes("enforcement") ||
            ruleTypeLower.includes("fine") ||
            ruleTypeLower.includes("lien") ||
            descLower.includes("enforcement") ||
            descLower.includes("penalty")
          );
        case "disclosure":
          return ruleTypeLower.includes("disclosure") || descLower.includes("disclosure") || descLower.includes("resale");
        default:
          return false;
      }
    });

    if (matchingRules.length === 0) {
      return {
        rule: statute,
        status: "not_addressed",
        requiredValue: statute.requirement,
        gap: "No corresponding rule found in governing documents",
        recommendation: `Add explicit provision to governing documents addressing: ${statute.requirement}`,
      };
    }

    const bestMatch = matchingRules.reduce((best, current) =>
      current.confidence > best.confidence ? current : best,
    );

    const meetsNoticePeriod =
      !statute.noticePeriodDays ||
      (bestMatch.periodDays !== undefined && bestMatch.periodDays >= statute.noticePeriodDays);

    if (meetsNoticePeriod) {
      return {
        rule: statute,
        status: "compliant",
        currentValue: bestMatch.value ?? bestMatch.description,
        requiredValue: statute.requirement,
        recommendation: "Continue current compliance approach; review at next governing document update",
      };
    }

    return {
      rule: statute,
      status: "non_compliant",
      currentValue: bestMatch.value ?? bestMatch.description,
      requiredValue: statute.requirement,
      gap: statute.noticePeriodDays
        ? `Document specifies ${bestMatch.periodDays ?? "unknown"} days; statute requires ${statute.noticePeriodDays} days`
        : "Document provision does not meet statutory minimum requirement",
      recommendation: `Update governing documents to require: ${statute.requirement}`,
    };
  });

  const summary = {
    total: items.length,
    compliant: items.filter((i) => i.status === "compliant").length,
    nonCompliant: items.filter((i) => i.status === "non_compliant").length,
    notAddressed: items.filter((i) => i.status === "not_addressed").length,
    pendingReview: items.filter((i) => i.status === "pending_review").length,
  };

  return { state, analysedAt: now, items, summary };
}

export function generateComplianceReport(
  state: HoaState,
  extractedRules?: ExtractedDocRule[],
): ComplianceReport {
  if (!extractedRules || extractedRules.length === 0) {
    const statutes = getStatutesByState(state);
    const now = new Date().toISOString();
    const items: ComplianceItem[] = statutes.map((statute) => ({
      rule: statute,
      status: "not_addressed",
      requiredValue: statute.requirement,
      gap: "No governing documents analyzed yet",
      recommendation: `Upload CC&Rs and bylaws to assess compliance with: ${statute.title}`,
    }));
    return {
      state,
      analysedAt: now,
      items,
      summary: {
        total: items.length,
        compliant: 0,
        nonCompliant: 0,
        notAddressed: items.length,
        pendingReview: 0,
      },
    };
  }

  return mapExtractedRulesToStatutes(extractedRules, state);
}

export const VALID_STATES: HoaState[] = ["FL", "CA", "TX", "NV"];

export const STATE_NAMES: Record<HoaState, string> = {
  FL: "Florida",
  CA: "California",
  TX: "Texas",
  NV: "Nevada",
};

export const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  notice_period: "Notice Period",
  disclosure: "Disclosure",
  meeting_frequency: "Meeting Frequency",
  record_keeping: "Record Keeping",
  financial: "Financial",
  election: "Election",
  enforcement: "Enforcement",
};
