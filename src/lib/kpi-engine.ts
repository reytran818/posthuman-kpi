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

export const FounderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  kpis: z.array(KPISchema),
});

export type Founder = z.infer<typeof FounderSchema>;

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

const TIMEFRAME_DECAY = 0.85;

/**
 * Converts a single KPI into an enterprise value score.
 *
 * Formula:
 *   score = weight × categoryMultiplier × difficultyMultiplier × timeDecay × scaleNorm
 *
 * - weight: founder-defined importance (0–100)
 * - categoryMultiplier: value amplifier based on category's typical contribution to enterprise value
 * - difficultyMultiplier: harder KPIs are worth more
 * - timeDecay: longer timeframes reduce the annualized score via exponential decay
 * - scaleNorm: log-scaled normalization of the target value to prevent astronomical numbers
 *   from dominating (e.g., $10M revenue target vs "hire 5 engineers")
 */
export function kpiToEnterpriseValue(kpi: KPI): number {
  const categoryMult = CATEGORY_VALUE_MULTIPLIERS[kpi.category];
  const difficultyMult = DIFFICULTY_MULTIPLIERS[kpi.difficulty];
  const timeDecay = Math.pow(TIMEFRAME_DECAY, kpi.timeframeMonths / 12);
  const scaleNorm = Math.log10(Math.max(kpi.targetValue, 1) + 1);

  return kpi.weight * categoryMult * difficultyMult * timeDecay * scaleNorm;
}

/**
 * Calculates the total enterprise value contribution for a founder
 * based on all their KPIs.
 */
export function founderEnterpriseValue(founder: Founder): number {
  return founder.kpis.reduce((total, kpi) => total + kpiToEnterpriseValue(kpi), 0);
}

/**
 * Given multiple founders, calculates equitable equity split
 * based on their relative enterprise value contributions.
 *
 * Returns a map of founder ID to equity percentage (0–100).
 */
export function calculateEquitySplit(
  founders: Founder[]
): { founderId: string; founderName: string; equityPercent: number; rawScore: number }[] {
  const scores = founders.map((f) => ({
    founderId: f.id,
    founderName: f.name,
    rawScore: founderEnterpriseValue(f),
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

/**
 * Projects the implied enterprise value of the company
 * based on founders' KPIs aggregate — a rough indicator
 * of expected 12-month value trajectory.
 *
 * Benchmark: A "typical" seed-stage startup with 2 founders and
 * standard KPIs might score ~500 raw points ≈ $2M enterprise value.
 * This scaling factor converts raw scores to dollar estimates.
 */
const VALUE_SCALING_FACTOR = 4000;

export function projectedEnterpriseValue(founders: Founder[]): number {
  const totalRaw = founders.reduce(
    (sum, f) => sum + founderEnterpriseValue(f),
    0
  );
  return totalRaw * VALUE_SCALING_FACTOR;
}

/**
 * Analyzes fairness of the KPI distribution and flags potential imbalances.
 */
export function fairnessAnalysis(founders: Founder[]): {
  isBalanced: boolean;
  warnings: string[];
  recommendations: string[];
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
      warnings.push(`${f.name} has no KPIs assigned.`);
    } else if (f.kpis.length < 2) {
      recommendations.push(
        `${f.name} has only ${f.kpis.length} KPI. Consider adding more dimensions.`
      );
    }
  }

  return {
    isBalanced: warnings.length === 0,
    warnings,
    recommendations,
  };
}
