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

export const FounderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  requestedEquity: z.number().min(0).max(100).optional(),
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
