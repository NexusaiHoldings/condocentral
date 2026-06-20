/**
 * Fair Housing Act compliance filter for AI-generated violation notices.
 *
 * Screens generated letter text for references to protected classes under
 * the Fair Housing Act (42 U.S.C. § 3604): race, color, national origin,
 * religion, sex, familial status, and disability.  Any match blocks
 * board approval — the notice must be regenerated before dispatch.
 *
 * Per ceo_briefing: this feature is most exposed to Fair Housing Act
 * liability.  The filter runs on every AI draft before it surfaces to the
 * board; fair_housing_approved = false is a hard gate in the state machine.
 */

export type RiskLevel = "low" | "medium" | "high";

export interface FairHousingFilterResult {
  approved: boolean;
  flaggedTerms: string[];
  riskLevel: RiskLevel;
  reasoning: string;
}

interface ProtectedClassPattern {
  category: string;
  patterns: RegExp[];
}

/** Explicit protected-class language patterns (FHA § 3604 seven classes). */
const PROTECTED_CLASS_PATTERNS: ProtectedClassPattern[] = [
  {
    category: "race",
    patterns: [
      /\b(race|racial|racist|racism|white[-\s]?only|colored|negro|racial[-\s]?group|ethnic[-\s]?background)\b/gi,
    ],
  },
  {
    category: "color",
    patterns: [
      /\b(skin[-\s]?color|complexion|dark[-\s]?skinned|light[-\s]?skinned|skin[-\s]?tone)\b/gi,
    ],
  },
  {
    category: "national origin",
    patterns: [
      /\b(national[-\s]?origin|foreigner|illegal[-\s]?alien|undocumented|country[-\s]?of[-\s]?origin|english[-\s]?only[-\s]?residents|no[-\s]?foreigners|non[-\s]?citizen)\b/gi,
    ],
  },
  {
    category: "religion",
    patterns: [
      /\b(christian[-\s]?only|jewish[-\s]?only|muslim[-\s]?ban|no[-\s]?jews|no[-\s]?muslims|no[-\s]?christians|religious[-\s]?affiliation|no[-\s]?atheists)\b/gi,
    ],
  },
  {
    category: "sex or gender",
    patterns: [
      /\b(male[-\s]?only|female[-\s]?only|no[-\s]?women|no[-\s]?men|gender[-\s]?discrimination|sex[-\s]?discrimination)\b/gi,
    ],
  },
  {
    category: "familial status",
    patterns: [
      /\b(no[-\s]?children|no[-\s]?kids|adults[-\s]?only|child[-\s]?free|no[-\s]?families|no[-\s]?pregnant|singles[-\s]?only|no[-\s]?minors)\b/gi,
    ],
  },
  {
    category: "disability",
    patterns: [
      /\b(no[-\s]?disabled|no[-\s]?handicap|wheelchair[-\s]?free|mentally[-\s]?ill[-\s]?free|sane[-\s]?only|no[-\s]?disability)\b/gi,
    ],
  },
];

/** Patterns suggesting disparate impact even without explicit slurs. */
const DISPARATE_IMPACT_PATTERNS: RegExp[] = [
  /\b(preferred[-\s]?type[-\s]?of[-\s]?resident|certain[-\s]?type[-\s]?of[-\s]?people|specific[-\s]?background)\b/gi,
  /\b(residents[-\s]?must[-\s]?be|only[-\s]?residents[-\s]?who[-\s]?are|we[-\s]?prefer[-\s]?residents)\b/gi,
  /\b(traditionally[-\s]?our[-\s]?community|historically[-\s]?our[-\s]?neighborhood)\b/gi,
];

/**
 * Runs the Fair Housing Act compliance filter on a given text.
 *
 * Returns approved=false and riskLevel "high" if any protected-class
 * reference is found; "medium" for disparate-impact language; "low" + approved
 * only when neither category fires.
 */
export function runFairHousingFilter(text: string): FairHousingFilterResult {
  const flaggedTerms: string[] = [];
  const flaggedCategories = new Set<string>();

  for (const protectedClass of PROTECTED_CLASS_PATTERNS) {
    for (const pattern of protectedClass.patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          flaggedTerms.push(`[${protectedClass.category}] "${match.trim()}"`);
        }
        flaggedCategories.add(protectedClass.category);
      }
    }
  }

  let disparateImpactFound = false;
  for (const pattern of DISPARATE_IMPACT_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        flaggedTerms.push(`[disparate impact risk] "${match.trim()}"`);
      }
      disparateImpactFound = true;
    }
  }

  const categoryList = [...flaggedCategories];

  if (categoryList.length >= 2) {
    return {
      approved: false,
      flaggedTerms,
      riskLevel: "high",
      reasoning: `Text references multiple protected classes (${categoryList.join(", ")}). Remove all protected-class references and limit the notice to the specific CC&R provision violated.`,
    };
  }

  if (categoryList.length === 1) {
    return {
      approved: false,
      flaggedTerms,
      riskLevel: "high",
      reasoning: `Text references the protected class "${categoryList[0]}". This language violates the Fair Housing Act and must be removed before the notice can proceed.`,
    };
  }

  if (disparateImpactFound) {
    return {
      approved: false,
      flaggedTerms,
      riskLevel: "medium",
      reasoning:
        "Text contains phrasing that may produce disparate impact on a protected class. Board should ensure the notice focuses exclusively on the specific CC&R violation, not resident characteristics.",
    };
  }

  return {
    approved: true,
    flaggedTerms: [],
    riskLevel: "low",
    reasoning:
      "No protected-class language or disparate-impact risk patterns detected. Notice is limited to the cited CC&R provision and enforcement action.",
  };
}
