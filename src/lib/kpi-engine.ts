import { z } from "zod";

export const KPICategorySchema = z.enum([
  "revenue",
  "product",
  "technical",
  "operations",
  "marketing",
  "fundraising",
  "leadership",
  "culture",
]);

export type KPICategory = z.infer<typeof KPICategorySchema>;

export const KPISchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: KPICategorySchema,
  targetValue: z.number(),
  unit: z.string(),
  weight: z.number().min(0).max(100),
  timeframeMonths: z.number().min(1).max(60),
  difficulty: z.enum(["low", "medium", "high", "extreme"]),
});

export type KPI = z.infer<typeof KPISchema>;

export const ContributionTypeSchema = z.enum([
  "execution",
  "domain_expertise",
  "technical_build",
  "revenue_generated",
  "capital_invested",
  "ip_created",
  "network_connections",
  "idea_vision",
  "market_research",
  "team_recruited",
]);

export type ContributionType = z.infer<typeof ContributionTypeSchema>;

export const ContributionSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: ContributionTypeSchema,
  evidenceUrl: z.string().optional(),
  estimatedValue: z.number().min(0),
  hoursInvested: z.number().min(0),
});

export type Contribution = z.infer<typeof ContributionSchema>;

export const AttachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  type: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

export const CommitmentStatusSchema = z.enum([
  "full_time",
  "part_time",
  "employed_elsewhere",
  "student",
  "transitioning",
]);

export type CommitmentStatus = z.infer<typeof CommitmentStatusSchema>;

export const FounderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  requestedEquity: z.number().min(0).max(100).optional(),
  commitmentStatus: CommitmentStatusSchema.optional(),
  fullTimeDate: z.string().optional(),
  resume: z.string().optional(),
  yearsExperience: z.number().optional(),
  relevantSkills: z.array(z.string()).optional(),
  contributions: z.array(ContributionSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  kpis: z.array(KPISchema),
});

export type Founder = z.infer<typeof FounderSchema>;

// --- Value multipliers ---

const CATEGORY_VALUE_MULTIPLIERS: Record<KPICategory, number> = {
  revenue: 1.5,
  fundraising: 1.4,
  product: 1.3,
  technical: 1.2,
  marketing: 1.1,
  operations: 1.0,
  leadership: 1.15,
  culture: 0.9,
};

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  low: 0.6,
  medium: 1.0,
  high: 1.5,
  extreme: 2.2,
};

/**
 * Contribution type weights.
 * Execution-oriented contributions are weighted significantly higher than ideas.
 * This reflects the principle that execution creates enterprise value.
 */
const CONTRIBUTION_TYPE_WEIGHTS: Record<ContributionType, number> = {
  execution: 1.0,
  technical_build: 0.95,
  revenue_generated: 0.9,
  capital_invested: 0.85,
  ip_created: 0.8,
  domain_expertise: 0.7,
  team_recruited: 0.65,
  network_connections: 0.5,
  market_research: 0.4,
  idea_vision: 0.15,
};

const TIMEFRAME_DECAY = 0.85;

/**
 * Converts a single KPI into an enterprise value score.
 */
export function kpiToEnterpriseValue(kpi: KPI): number {
  const categoryMult = CATEGORY_VALUE_MULTIPLIERS[kpi.category];
  const difficultyMult = DIFFICULTY_MULTIPLIERS[kpi.difficulty];
  const timeDecay = Math.pow(TIMEFRAME_DECAY, kpi.timeframeMonths / 12);
  const scaleNorm = Math.log10(Math.max(kpi.targetValue, 1) + 1);

  return kpi.weight * categoryMult * difficultyMult * timeDecay * scaleNorm;
}

/**
 * Calculates the value of a single prior contribution.
 * Factors: type weight × (hours invested as effort signal) × log-scaled value.
 */
export function contributionToValue(contribution: Contribution): number {
  const typeWeight = CONTRIBUTION_TYPE_WEIGHTS[contribution.type];
  const effortFactor = Math.log2(Math.max(contribution.hoursInvested, 1) + 1);
  const valueFactor = Math.log10(Math.max(contribution.estimatedValue, 1) + 1);
  return typeWeight * effortFactor * valueFactor * 10;
}

/**
 * Calculates the total prior contribution value for a founder.
 */
export function founderContributionValue(founder: Founder): number {
  const contributions = founder.contributions || [];
  const baseContributions = contributions.reduce(
    (total, c) => total + contributionToValue(c),
    0
  );

  // Experience bonus: diminishing returns, caps around 20 years
  const years = founder.yearsExperience || 0;
  const experienceBonus = Math.log2(Math.max(years, 1) + 1) * 5;

  return baseContributions + experienceBonus;
}

/**
 * Calculates the total enterprise value contribution for a founder
 * including both future KPIs and prior contributions.
 *
 * Split: 70% future execution (KPIs) + 30% prior contributions
 * This ensures execution commitment outweighs past work.
 */
const FUTURE_WEIGHT = 0.7;
const PRIOR_WEIGHT = 0.3;

export function founderEnterpriseValue(founder: Founder): number {
  const kpiScore = founder.kpis.reduce(
    (total, kpi) => total + kpiToEnterpriseValue(kpi),
    0
  );
  const contributionScore = founderContributionValue(founder);
  return kpiScore * FUTURE_WEIGHT + contributionScore * PRIOR_WEIGHT;
}

/**
 * Returns only the KPI-based score (for display breakdown).
 */
export function founderKPIScore(founder: Founder): number {
  return founder.kpis.reduce((total, kpi) => total + kpiToEnterpriseValue(kpi), 0);
}

/**
 * Given multiple founders, calculates equitable equity split.
 */
export function calculateEquitySplit(
  founders: Founder[]
): {
  founderId: string;
  founderName: string;
  equityPercent: number;
  rawScore: number;
  kpiScore: number;
  contributionScore: number;
}[] {
  const scores = founders.map((f) => ({
    founderId: f.id,
    founderName: f.name,
    rawScore: founderEnterpriseValue(f),
    kpiScore: founderKPIScore(f) * FUTURE_WEIGHT,
    contributionScore: founderContributionValue(f) * PRIOR_WEIGHT,
  }));

  const totalScore = scores.reduce((sum, s) => sum + s.rawScore, 0);

  if (totalScore === 0) {
    const equalSplit = 100 / founders.length;
    return scores.map((s) => ({ ...s, equityPercent: equalSplit }));
  }

  return scores.map((s) => ({
    ...s,
    equityPercent: (s.rawScore / totalScore) * 100,
  }));
}

const VALUE_SCALING_FACTOR = 4000;

export function projectedEnterpriseValue(founders: Founder[]): number {
  const totalRaw = founders.reduce(
    (sum, f) => sum + founderEnterpriseValue(f),
    0
  );
  return totalRaw * VALUE_SCALING_FACTOR;
}

/**
 * Detects overlapping contributions and responsibilities between founders.
 */
export interface OverlapFlag {
  founderNames: string[];
  area: string;
  severity: "info" | "warning" | "conflict";
  description: string;
}

export function detectOverlaps(founders: Founder[]): OverlapFlag[] {
  const overlaps: OverlapFlag[] = [];

  // Check KPI category overlaps
  const foundersByCategory: Record<string, string[]> = {};
  for (const f of founders) {
    for (const kpi of f.kpis) {
      if (!foundersByCategory[kpi.category]) {
        foundersByCategory[kpi.category] = [];
      }
      if (!foundersByCategory[kpi.category].includes(f.name)) {
        foundersByCategory[kpi.category].push(f.name);
      }
    }
  }

  for (const [category, names] of Object.entries(foundersByCategory)) {
    if (names.length > 1) {
      overlaps.push({
        founderNames: names,
        area: category,
        severity: names.length > 2 ? "conflict" : "warning",
        description: `Multiple founders (${names.join(", ")}) have KPIs in "${category}". Clarify ownership or split responsibilities.`,
      });
    }
  }

  // Check contribution type overlaps
  const foundersByContribType: Record<string, string[]> = {};
  for (const f of founders) {
    for (const c of f.contributions || []) {
      if (!foundersByContribType[c.type]) {
        foundersByContribType[c.type] = [];
      }
      if (!foundersByContribType[c.type].includes(f.name)) {
        foundersByContribType[c.type].push(f.name);
      }
    }
  }

  for (const [type, names] of Object.entries(foundersByContribType)) {
    if (names.length > 1) {
      const label = type.replace(/_/g, " ");
      overlaps.push({
        founderNames: names,
        area: label,
        severity: "warning",
        description: `Multiple founders claim prior "${label}" contributions. Review for double-counting.`,
      });
    }
  }

  // Check skill overlaps
  const skillOwners: Record<string, string[]> = {};
  for (const f of founders) {
    for (const skill of f.relevantSkills || []) {
      const normalized = skill.toLowerCase().trim();
      if (!skillOwners[normalized]) skillOwners[normalized] = [];
      if (!skillOwners[normalized].includes(f.name)) {
        skillOwners[normalized].push(f.name);
      }
    }
  }

  const overlappingSkills = Object.entries(skillOwners).filter(
    ([, names]) => names.length > 1
  );
  if (overlappingSkills.length > 0) {
    const topOverlaps = overlappingSkills.slice(0, 3);
    for (const [skill, names] of topOverlaps) {
      overlaps.push({
        founderNames: names,
        area: skill,
        severity: "info",
        description: `Shared skill "${skill}" between ${names.join(" & ")}. Consider who owns execution in this area.`,
      });
    }
  }

  // Check if someone only has idea/vision contributions and no execution
  for (const f of founders) {
    const contribs = f.contributions || [];
    if (contribs.length > 0) {
      const executionTypes: ContributionType[] = [
        "execution",
        "technical_build",
        "revenue_generated",
        "capital_invested",
        "ip_created",
        "team_recruited",
      ];
      const hasExecution = contribs.some((c) =>
        executionTypes.includes(c.type)
      );
      const hasIdeaOnly = contribs.every(
        (c) => c.type === "idea_vision" || c.type === "market_research"
      );

      if (hasIdeaOnly && !hasExecution) {
        overlaps.push({
          founderNames: [f.name],
          area: "execution gap",
          severity: "warning",
          description: `${f.name} only has idea/research contributions. Ideas are weighted at 15% of execution value. Add concrete execution commitments via KPIs.`,
        });
      }
    }
  }

  return overlaps;
}

/**
 * Analyzes fairness of the KPI distribution and flags potential imbalances.
 */
export function fairnessAnalysis(founders: Founder[]): {
  isBalanced: boolean;
  warnings: string[];
  recommendations: string[];
  overlaps: OverlapFlag[];
} {
  const equitySplit = calculateEquitySplit(founders);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const maxEquity = Math.max(...equitySplit.map((s) => s.equityPercent));
  const minEquity = Math.min(...equitySplit.map((s) => s.equityPercent));
  const ratio = maxEquity / Math.max(minEquity, 0.01);

  if (ratio > 4) {
    warnings.push(
      `Equity ratio of ${ratio.toFixed(1)}:1 is highly skewed. Consider rebalancing KPI weights.`
    );
  } else if (ratio > 2.5) {
    warnings.push(
      `Equity ratio of ${ratio.toFixed(1)}:1 is moderately skewed.`
    );
  }

  const categoryDistribution: Record<string, number> = {};
  for (const f of founders) {
    for (const kpi of f.kpis) {
      categoryDistribution[kpi.category] =
        (categoryDistribution[kpi.category] || 0) + 1;
    }
  }

  if (!categoryDistribution["revenue"] && !categoryDistribution["fundraising"]) {
    recommendations.push(
      "No revenue or fundraising KPIs detected. Consider adding financial targets."
    );
  }

  if (!categoryDistribution["product"] && !categoryDistribution["technical"]) {
    recommendations.push(
      "No product or technical KPIs detected. Building is critical for enterprise value."
    );
  }

  for (const f of founders) {
    if (f.kpis.length === 0) {
      warnings.push(`${f.name} has no KPIs assigned — only prior contributions count.`);
    } else if (f.kpis.length < 2) {
      recommendations.push(
        `${f.name} has only ${f.kpis.length} KPI. Consider adding more dimensions.`
      );
    }
  }

  // Check for founders with no execution commitment
  for (const f of founders) {
    if (f.kpis.length === 0 && (!f.contributions || f.contributions.length === 0)) {
      warnings.push(`${f.name} has neither KPIs nor prior contributions recorded.`);
    }
  }

  // Compare requested equity vs calculated equity
  for (const f of founders) {
    if (f.requestedEquity != null && f.requestedEquity > 0) {
      const calculated = equitySplit.find((s) => s.founderId === f.id);
      if (calculated) {
        const diff = f.requestedEquity - calculated.equityPercent;
        if (diff > 10) {
          warnings.push(
            `${f.name} requests ${f.requestedEquity}% but algorithm calculates ${calculated.equityPercent.toFixed(1)}%. They are over-asking by ${diff.toFixed(1)} percentage points.`
          );
        } else if (diff > 5) {
          recommendations.push(
            `${f.name} requests ${f.requestedEquity}% — algorithm suggests ${calculated.equityPercent.toFixed(1)}%. Gap of ${diff.toFixed(1)}pp may need justification.`
          );
        } else if (diff < -10) {
          recommendations.push(
            `${f.name} requests ${f.requestedEquity}% but algorithm values them at ${calculated.equityPercent.toFixed(1)}%. They may be undervaluing themselves.`
          );
        }
      }
    }
  }

  // Check total requested equity
  const totalRequested = founders.reduce(
    (sum, f) => sum + (f.requestedEquity || 0),
    0
  );
  if (totalRequested > 0 && totalRequested !== 100) {
    if (totalRequested > 100) {
      warnings.push(
        `Total requested equity is ${totalRequested}% — exceeds 100%. Founders need to reconcile.`
      );
    } else if (totalRequested < 90) {
      recommendations.push(
        `Total requested equity is only ${totalRequested}%. Remaining ${(100 - totalRequested).toFixed(0)}% is unallocated (option pool?).`
      );
    }
  }

  const overlaps = detectOverlaps(founders);

  return {
    isBalanced: warnings.length === 0 && overlaps.filter((o) => o.severity === "conflict").length === 0,
    warnings,
    recommendations,
    overlaps,
  };
}

/**
 * Validates KPIs for vagueness. Flags targets that are:
 * - Percentages of unknown quantities
 * - Relative to external factors outside the founder's control
 * - Non-specific or unmeasurable
 */
export interface KPIValidationIssue {
  founderId: string;
  founderName: string;
  kpiId: string;
  kpiName: string;
  issue: string;
  severity: "error" | "warning";
}

const VAGUE_PATTERNS = [
  { pattern: /% of (his|her|their|my) (income|salary|pay|earnings)/i, message: "Percentage of unknown income is not a hard number. Commit to a specific dollar amount." },
  { pattern: /% of (another|other|external|outside)/i, message: "Dependent on external factors outside this company. Use an absolute target." },
  { pattern: /\b(try|attempt|aim|hope|maybe|possibly|approximately|around|about|roughly)\b/i, message: "Vague language detected. KPIs must be specific and binary — achieved or not." },
  { pattern: /\b(contribute|give|provide) .*(time|effort|energy)\b/i, message: "Time/effort is not a result. Specify a measurable deliverable outcome." },
  { pattern: /\b(help|assist|support|participate)\b/i, message: "Helping is not measurable. Define what the output/result is." },
  { pattern: /\b(when|if) (I|we|they|he|she) (get|receive|have|know)\b/i, message: "Conditional on future unknowns. Commit to a number now." },
  { pattern: /\btbd\b|to be determined|not sure|don't know/i, message: "TBD is not acceptable in a binding agreement. Set a number." },
];

export function validateKPIs(founders: Founder[]): KPIValidationIssue[] {
  const issues: KPIValidationIssue[] = [];

  for (const f of founders) {
    for (const kpi of f.kpis) {
      const textToCheck = `${kpi.name} ${kpi.description} ${kpi.targetValue} ${kpi.unit}`;

      for (const { pattern, message } of VAGUE_PATTERNS) {
        if (pattern.test(textToCheck)) {
          issues.push({
            founderId: f.id,
            founderName: f.name,
            kpiId: kpi.id,
            kpiName: kpi.name,
            issue: message,
            severity: "error",
          });
          break;
        }
      }

      // Flag percentage-based units without absolute baseline
      if (kpi.unit === "%" && kpi.targetValue < 100 && kpi.description.length < 20) {
        issues.push({
          founderId: f.id,
          founderName: f.name,
          kpiId: kpi.id,
          kpiName: kpi.name,
          issue: "Percentage target without clear baseline. What is 100%? Specify absolute numbers where possible.",
          severity: "warning",
        });
      }

      // Flag very low target values that seem like placeholders
      if (kpi.targetValue === 0) {
        issues.push({
          founderId: f.id,
          founderName: f.name,
          kpiId: kpi.id,
          kpiName: kpi.name,
          issue: "Target value is 0. This KPI has no measurable goal.",
          severity: "error",
        });
      }
    }
  }

  return issues;
}

/**
 * Failure scenario analysis: what happens if a founder delivers 0%, 50%, or full.
 * Shows how equity SHOULD be redistributed based on actual performance.
 */
export interface FailureScenario {
  founderId: string;
  founderName: string;
  scenarioLabel: string;
  deliveryPercent: number;
  adjustedEquity: number;
  equityChange: number;
}

export function failureScenarios(founders: Founder[]): FailureScenario[] {
  const scenarios: FailureScenario[] = [];
  const baseEquity = calculateEquitySplit(founders);

  for (const targetFounder of founders) {
    for (const delivery of [0, 50]) {
      // Simulate reduced KPI scores
      const simulatedFounders = founders.map((f) => {
        if (f.id !== targetFounder.id) return f;
        return {
          ...f,
          kpis: f.kpis.map((kpi) => ({
            ...kpi,
            weight: kpi.weight * (delivery / 100),
          })),
        };
      });

      const newSplit = calculateEquitySplit(simulatedFounders);
      const originalEquity = baseEquity.find(
        (s) => s.founderId === targetFounder.id
      )?.equityPercent || 0;
      const newEquity = newSplit.find(
        (s) => s.founderId === targetFounder.id
      )?.equityPercent || 0;

      scenarios.push({
        founderId: targetFounder.id,
        founderName: targetFounder.name,
        scenarioLabel: delivery === 0 ? "Total failure (0%)" : "Partial delivery (50%)",
        deliveryPercent: delivery,
        adjustedEquity: newEquity,
        equityChange: newEquity - originalEquity,
      });
    }
  }

  return scenarios;
}

/**
 * Investor Readiness Assessment — flags issues that would concern
 * sophisticated investors (YC, a16z, Sequoia, etc.)
 */
export interface InvestorRedFlag {
  id: string;
  category: "critical" | "warning" | "suggestion";
  title: string;
  description: string;
  fix: string;
}

export interface InvestorReadiness {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  redFlags: InvestorRedFlag[];
  vestingStructure: VestingRecommendation;
  capTable: CapTableEntry[];
}

export interface VestingRecommendation {
  cliff: number; // months
  totalVesting: number; // months
  accelerationTrigger: string;
  performanceGating: boolean;
}

export interface CapTableEntry {
  holder: string;
  type: "founder" | "option_pool" | "reserved";
  percent: number;
  vested: number;
  notes: string;
}

export function investorReadinessCheck(founders: Founder[]): InvestorReadiness {
  const redFlags: InvestorRedFlag[] = [];
  const equitySplit = calculateEquitySplit(founders);

  // 1. Equal splits with no rationale
  const equities = equitySplit.map((s) => s.equityPercent);
  const maxDiff = Math.max(...equities) - Math.min(...equities);
  if (maxDiff < 3 && founders.length > 1) {
    redFlags.push({
      id: "equal_split",
      category: "critical",
      title: "Equal equity split detected",
      description:
        "YC and top investors view equal splits as a sign that founders haven't had hard conversations about value. It suggests avoidance, not fairness.",
      fix: "Differentiate equity based on role criticality, time commitment, capital invested, and opportunity cost. Even a 55/45 split shows intentionality.",
    });
  }

  // 2. No option pool reserved
  const totalFounderEquity = equities.reduce((sum, e) => sum + e, 0);
  if (totalFounderEquity > 85) {
    redFlags.push({
      id: "no_option_pool",
      category: "critical",
      title: "No employee option pool reserved",
      description:
        "Investors expect a 10-20% option pool pre-money. Without it, early hires can't be properly incentivized, and investors will force dilution at Series A.",
      fix: "Reserve 10-15% for an employee stock option pool (ESOP). This is standard for YC companies.",
    });
  }

  // 3. Full-time commitment check
  for (const f of founders) {
    const status = f.commitmentStatus || "full_time";
    const eq = equitySplit.find((s) => s.founderId === f.id)?.equityPercent || 0;

    if (status === "employed_elsewhere") {
      redFlags.push({
        id: `employed_${f.id}`,
        category: "critical",
        title: `${f.name} is employed elsewhere — not full-time`,
        description:
          "Investment requires ALL founders to be full-time. No serious investor will fund a team where a founder keeps their day job. This person must quit before or upon funding.",
        fix: f.fullTimeDate
          ? `Committed to go full-time by ${f.fullTimeDate}. Include this as a binding condition in the agreement.`
          : `${f.name} must commit to a specific quit date. Without a hard date, reduce to advisor equity (1-5%).`,
      });
    } else if (status === "student") {
      redFlags.push({
        id: `student_${f.id}`,
        category: "critical",
        title: `${f.name} is currently a student — not full-time`,
        description:
          "Investment requires full-time commitment. YC and other accelerators expect founders to drop out or take leave. A student splitting time between coursework and a startup cannot move at the speed required.",
        fix: f.fullTimeDate
          ? `Committed to go full-time (leave/drop out) by ${f.fullTimeDate}. This must be a binding condition.`
          : `${f.name} must commit to take leave or drop out upon funding. Set a specific date.`,
      });
    } else if (status === "part_time") {
      redFlags.push({
        id: `part_time_${f.id}`,
        category: "critical",
        title: `${f.name} is part-time with ${eq.toFixed(0)}% equity`,
        description:
          "Part-time founders are unacceptable post-investment. Investors require 100% commitment from the founding team. Split attention = split results.",
        fix: f.fullTimeDate
          ? `Transition to full-time by ${f.fullTimeDate}. Make this a vesting condition.`
          : `${f.name} must go full-time or be reclassified as advisor (1-5% equity with vesting).`,
      });
    } else if (status === "transitioning" && !f.fullTimeDate) {
      redFlags.push({
        id: `transition_nodate_${f.id}`,
        category: "warning",
        title: `${f.name} is "transitioning" but has no committed date`,
        description:
          "Saying 'I'll go full-time eventually' isn't good enough. Investors need a specific date that becomes a binding condition of the equity agreement.",
        fix: `Set a specific full-time start date. Make equity vesting conditional on meeting this date.`,
      });
    }
  }

  // Legacy: also detect from KPI text for anyone who didn't set status
  for (const f of founders) {
    if (f.commitmentStatus && f.commitmentStatus !== "full_time") continue;
    const hasPartTimeSignals =
      f.kpis.some((k) =>
        /other job|part.?time|side|moonlight/i.test(
          `${k.name} ${k.description}`
        )
      ) ||
      f.contributions?.some((c) =>
        /other job|part.?time|side/i.test(c.description)
      );

    const eq = equitySplit.find((s) => s.founderId === f.id)?.equityPercent || 0;

    if (hasPartTimeSignals && eq > 20) {
      redFlags.push({
        id: `part_time_signal_${f.id}`,
        category: "critical",
        title: `${f.name} appears part-time with ${eq.toFixed(0)}% equity`,
        description:
          "KPI text references another job or part-time work. Investment requires ALL founders full-time. Quit or be reclassified.",
        fix: `${f.name} must commit to full-time with a specific date, or reduce to advisor-level equity (1-5%).`,
      });
    }
  }

  // 4. No vesting mentioned
  redFlags.push({
    id: "vesting_required",
    category: founders.length > 1 ? "critical" : "warning",
    title: "Vesting schedule required",
    description:
      "Standard: 4-year vesting with 1-year cliff. Without vesting, a founder can walk away day 1 with full equity. Every serious investor requires this.",
    fix: "Add 4-year vesting, 1-year cliff, monthly thereafter. Consider acceleration on change-of-control and performance milestones.",
  });

  // 5. No IP assignment
  redFlags.push({
    id: "ip_assignment",
    category: "warning",
    title: "IP assignment agreement needed",
    description:
      "All work product must be assigned to the company. Without this, a departing founder could claim ownership of code, designs, or patents.",
    fix: "Include a PIIA (Proprietary Information and Inventions Assignment) agreement for all founders.",
  });

  // 6. No 83(b) election reminder
  redFlags.push({
    id: "83b_election",
    category: "warning",
    title: "83(b) election must be filed within 30 days",
    description:
      "If founders receive restricted stock, an 83(b) election avoids a massive tax bill when shares vest. Missing the 30-day deadline is irreversible.",
    fix: "File 83(b) elections with the IRS within 30 days of stock issuance. This is non-negotiable for US-based founders.",
  });

  // 7. Single founder doing everything
  if (founders.length === 1) {
    redFlags.push({
      id: "solo_founder",
      category: "warning",
      title: "Solo founder risk",
      description:
        "YC and most VCs prefer 2-3 co-founders. Solo founders have higher burnout rates and lack built-in accountability.",
      fix: "Consider adding a technical or business co-founder. If staying solo, demonstrate exceptional execution velocity.",
    });
  }

  // 8. Too many founders
  if (founders.length > 4) {
    redFlags.push({
      id: "too_many_founders",
      category: "warning",
      title: `${founders.length} founders is unusually high`,
      description:
        "Most successful startups have 2-3 founders. More than 4 creates decision-making overhead and equity fragmentation that concerns investors.",
      fix: "Consider whether all founding members need founder-level equity. Some may be better as early employees with option grants.",
    });
  }

  // 9. Ideas-only founders
  for (const f of founders) {
    const contribs = f.contributions || [];
    const onlyIdeas =
      contribs.length > 0 &&
      contribs.every(
        (c) => c.type === "idea_vision" || c.type === "market_research"
      );
    if (onlyIdeas && f.kpis.length === 0) {
      redFlags.push({
        id: `ideas_only_${f.id}`,
        category: "critical",
        title: `${f.name} has no execution commitment`,
        description:
          "This person contributes only ideas with no concrete KPIs. Investors will ask: 'What does this person actually DO?' Ideas alone don't justify equity.",
        fix: `${f.name} must commit to specific, measurable deliverables. Otherwise, reclassify as advisor (0.5-2% with vesting).`,
      });
    }
  }

  // 10. Vague KPIs present
  const kpiIssues = validateKPIs(founders);
  if (kpiIssues.filter((i) => i.severity === "error").length > 0) {
    redFlags.push({
      id: "vague_kpis",
      category: "warning",
      title: `${kpiIssues.filter((i) => i.severity === "error").length} vague/unmeasurable KPIs detected`,
      description:
        "Investors need to see that founders can set concrete, measurable goals. Vague KPIs signal inability to execute or lack of business sophistication.",
      fix: "Replace all vague KPIs with specific numbers: revenue targets, user counts, shipping dates, or capital raised.",
    });
  }

  // 11. No revenue/fundraising KPIs at all
  const hasRevenue = founders.some((f) =>
    f.kpis.some((k) => k.category === "revenue" || k.category === "fundraising")
  );
  if (!hasRevenue && founders.length > 0) {
    redFlags.push({
      id: "no_revenue_kpis",
      category: "warning",
      title: "No revenue or fundraising targets",
      description:
        "Every startup needs someone accountable for money — either generating revenue or raising capital. Investors will want to know who owns this.",
      fix: "Add specific revenue targets ($X MRR by date) or fundraising milestones ($X raised by date).",
    });
  }

  // 12. Equity requests exceed 100%
  const totalRequested = founders.reduce(
    (sum, f) => sum + (f.requestedEquity || 0),
    0
  );
  if (totalRequested > 100) {
    redFlags.push({
      id: "over_100",
      category: "critical",
      title: `Equity requests total ${totalRequested}% (exceeds 100%)`,
      description:
        "This is a fundamental red flag — founders can't agree on basic math. This would immediately disqualify you with any investor.",
      fix: "Reconcile equity requests before any investor conversation. Use this tool's algorithm as an objective baseline.",
    });
  }

  // Score calculation
  const criticals = redFlags.filter((f) => f.category === "critical").length;
  const warnings = redFlags.filter((f) => f.category === "warning").length;
  let score = 100 - criticals * 20 - warnings * 8;
  score = Math.max(0, Math.min(100, score));

  const grade: "A" | "B" | "C" | "D" | "F" =
    score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";

  // Option pool recommendation
  const optionPoolPercent = Math.max(0, 100 - totalFounderEquity);
  const capTable: CapTableEntry[] = [
    ...founders.map((f) => {
      const eq = equitySplit.find((s) => s.founderId === f.id)?.equityPercent || 0;
      // Apply option pool reduction (founders get 85% of their calculated split)
      const adjustedPercent = eq * 0.85;
      return {
        holder: f.name,
        type: "founder" as const,
        percent: Number(adjustedPercent.toFixed(2)),
        vested: 0,
        notes: f.role,
      };
    }),
    {
      holder: "Employee Option Pool (ESOP)",
      type: "option_pool" as const,
      percent: 15,
      vested: 0,
      notes: "Reserved for first 10-20 hires, advisors",
    },
  ];

  return {
    score,
    grade,
    redFlags,
    vestingStructure: {
      cliff: 12,
      totalVesting: 48,
      accelerationTrigger: "Double-trigger on acquisition (change of control + termination)",
      performanceGating: true,
    },
    capTable,
  };
}

/**
 * Assigns a recommended role based on where a founder's actual value lies
 * (KPI categories + contribution types), not what they call themselves.
 */
export interface RoleAssignment {
  founderId: string;
  founderName: string;
  declaredRole: string;
  recommendedRole: string;
  reasoning: string;
  mismatch: boolean;
  topCategory: string;
}

const ROLE_MAP: Record<string, { title: string; keywords: string[] }> = {
  revenue: { title: "Chief Revenue Officer", keywords: ["revenue", "sales", "fundraising", "deals"] },
  fundraising: { title: "Chief Financial Officer", keywords: ["fundraising", "capital", "investor relations"] },
  product: { title: "Chief Product Officer", keywords: ["product", "features", "design", "roadmap", "ux"] },
  technical: { title: "Chief Technology Officer", keywords: ["technical", "engineering", "code", "architecture"] },
  operations: { title: "Chief Operating Officer", keywords: ["operations", "processes", "hiring", "legal"] },
  marketing: { title: "Chief Marketing Officer", keywords: ["marketing", "growth", "brand", "content", "users"] },
  leadership: { title: "Chief Executive Officer", keywords: ["leadership", "strategy", "vision", "overall"] },
  culture: { title: "Head of People & Culture", keywords: ["culture", "team", "morale", "hr"] },
};

export function assignRoles(founders: Founder[]): RoleAssignment[] {
  return founders.map((f) => {
    const categoryScores: Record<string, number> = {};

    for (const kpi of f.kpis) {
      categoryScores[kpi.category] =
        (categoryScores[kpi.category] || 0) + kpi.weight;
    }

    if (f.contributions) {
      for (const c of f.contributions) {
        if (c.type === "execution" || c.type === "technical_build") {
          categoryScores["technical"] = (categoryScores["technical"] || 0) + 30;
        } else if (c.type === "revenue_generated") {
          categoryScores["revenue"] = (categoryScores["revenue"] || 0) + 30;
        } else if (c.type === "capital_invested") {
          categoryScores["fundraising"] = (categoryScores["fundraising"] || 0) + 25;
        } else if (c.type === "ip_created") {
          categoryScores["product"] = (categoryScores["product"] || 0) + 20;
        } else if (c.type === "team_recruited" || c.type === "network_connections") {
          categoryScores["operations"] = (categoryScores["operations"] || 0) + 15;
        } else if (c.type === "idea_vision") {
          categoryScores["leadership"] = (categoryScores["leadership"] || 0) + 5;
        } else if (c.type === "market_research" || c.type === "domain_expertise") {
          categoryScores["marketing"] = (categoryScores["marketing"] || 0) + 10;
        }
      }
    }

    const sorted = Object.entries(categoryScores).sort(([, a], [, b]) => b - a);
    const topCategory = sorted.length > 0 ? sorted[0][0] : "leadership";
    const mapped = ROLE_MAP[topCategory] || ROLE_MAP["operations"];
    const recommendedRole = mapped.title;

    // Check if the declared role matches what we'd assign
    const declaredLower = f.role.toLowerCase();
    const mismatch =
      !mapped.keywords.some((kw) => declaredLower.includes(kw)) &&
      !declaredLower.includes(recommendedRole.toLowerCase().split(" ").pop() || "");

    const reasoning =
      sorted.length > 0
        ? `${Math.round((sorted[0][1] / Math.max(Object.values(categoryScores).reduce((a, b) => a + b, 0), 1)) * 100)}% of value in "${topCategory}" category`
        : "No KPIs or contributions yet";

    return {
      founderId: f.id,
      founderName: f.name,
      declaredRole: f.role,
      recommendedRole,
      reasoning,
      mismatch,
      topCategory,
    };
  });
}
