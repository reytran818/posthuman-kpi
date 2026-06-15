import { generateObject } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from "zod";

export const maxDuration = 120;

const KPIResultSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(["revenue", "product", "technical", "operations", "marketing", "fundraising", "leadership", "culture"]),
  targetValue: z.number(),
  unit: z.string(),
  weight: z.number().min(1).max(100),
  timeframeMonths: z.number().min(1).max(60),
  difficulty: z.enum(["low", "medium", "high", "extreme"]),
  dealType: z.enum(["standard", "equity_exchange", "investment", "revenue_share", "flat_fee"]).optional(),
  theyGet: z.string().optional(),
  weGet: z.string().optional(),
  successCriteria: z.string().optional(),
});

export async function POST(req: Request) {
  const { founders } = await req.json();

  if (!founders || founders.length === 0) {
    return new Response(JSON.stringify({ error: "No founders" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updatedFounders = [];

  for (const founder of founders) {
    if (!founder.kpis || founder.kpis.length === 0) {
      updatedFounders.push(founder);
      continue;
    }

    const updatedKPIs = [];

    for (const kpi of founder.kpis) {
      try {
        const result = await generateObject({
          model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
          schema: KPIResultSchema,
          prompt: `You are the equity calculator for Posthuman Inc., an early-stage startup.

Regenerate this KPI with proper hard numbers. Keep the intent the same but fix any vague language, placeholder text, or improper units.

EXISTING KPI:
- Name: "${kpi.name}"
- Description: "${kpi.description || ""}"
- Category: ${kpi.category}
- Target: ${kpi.targetValue} ${kpi.unit}
- Weight: ${kpi.weight}
- Timeframe: ${kpi.timeframeMonths} months
- Difficulty: ${kpi.difficulty}
${kpi.dealType && kpi.dealType !== "standard" ? `- Deal type: ${kpi.dealType}` : ""}
${kpi.theyGet ? `- They get: ${kpi.theyGet}` : ""}
${kpi.weGet ? `- We get: ${kpi.weGet}` : ""}
${kpi.successCriteria ? `- Success criteria: ${kpi.successCriteria}` : ""}

FOUNDER CONTEXT:
- Name: ${founder.name}
- Role: ${founder.role}
- Hours/week: ${founder.hoursPerWeek || 40}

RULES:
- Keep the same intent/goal — don't change what they're trying to achieve
- targetValue MUST be a single hard number (never 0, never a range)
- unit MUST be a countable noun (users, deals, dollars, partnerships, features) — NEVER "5-10%" or percentage ranges
- If the current unit is a percentage range like "5-10%", figure out what they meant and use a proper unit
- Fix any placeholder text like [set #], [TBD], [set date]
- Fix vague language ("some", "several", "try to")
- weight should reflect importance: revenue/fundraising 70-100, product 50-80, marketing 40-70
- If it's clearly a partnership/deal, set dealType and fill theyGet/weGet/successCriteria
- For early-stage startups: revenue $5K-$100K MRR, users 1K-50K, partnerships 5-25, fundraising $250K-$2M`,
        });

        updatedKPIs.push({
          ...kpi,
          ...result.object,
          id: kpi.id,
        });
      } catch {
        updatedKPIs.push(kpi);
      }
    }

    updatedFounders.push({
      ...founder,
      kpis: updatedKPIs,
    });
  }

  return new Response(JSON.stringify({ founders: updatedFounders }), {
    headers: { "Content-Type": "application/json" },
  });
}
