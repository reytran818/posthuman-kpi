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

export const FounderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  resume: z.string().optional(),
  yearsExperience: z.number().optional(),
  relevantSkills: z.array(z.string()).optional(),
  contributions: z.array(ContributionSchema).optional(),
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

  const overlaps = detectOverlaps(founders);

  return {
    isBalanced: warnings.length === 0 && overlaps.filter((o) => o.severity === "conflict").length === 0,
    warnings,
    recommendations,
    overlaps,
  };
}
