import { generateObject } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { actionItem, role, existingKPIs } = await req.json();

  if (!actionItem) {
    return new Response(JSON.stringify({ error: "Action item required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await generateObject({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    schema: z.object({
      name: z.string().describe("Short KPI name (2-5 words)"),
      description: z.string().describe("Clear description of what success looks like with hard numbers"),
      category: z.enum(["revenue", "product", "technical", "operations", "marketing", "fundraising", "leadership", "culture"]),
      targetValue: z.number().describe("Hard number target — must be specific and measurable"),
      unit: z.string().describe("Countable unit: users, dollars, deals, partnerships, features, etc."),
      weight: z.number().min(1).max(100).describe("Importance weight 1-100 relative to company value"),
      timeframeMonths: z.number().min(1).max(60).describe("Realistic months to achieve this"),
      difficulty: z.enum(["low", "medium", "high", "extreme"]),
      dealType: z.enum(["standard", "equity_exchange", "investment", "revenue_share", "flat_fee"]).optional(),
      theyGet: z.string().optional().describe("What the other party gets (for partnerships/deals)"),
      weGet: z.string().optional().describe("What Posthuman gets from the deal"),
      successCriteria: z.string().optional().describe("How to verify this was achieved"),
      reasoning: z.string().describe("1-2 sentence explanation of the numbers chosen"),
    }),
    prompt: `You are the equity calculator for Posthuman Inc., an early-stage startup.

A founder with role "${role || "Founder"}" described their action item:
"${actionItem}"

${existingKPIs ? `They already have these KPIs: ${existingKPIs}` : ""}

Convert this into a structured KPI with HARD NUMBERS.

RULES:
- name: short (2-5 words), clear
- targetValue: MUST be a specific number — never 0, never a range. Pick the ambitious but achievable midpoint.
- unit: countable noun (users, deals, dollars, partnerships, downloads, features) — NEVER percentages or ranges like "5-10%"
- weight: reflects impact on company value. Revenue/fundraising = 70-100. Product = 50-80. Marketing = 40-70. Culture = 20-40.
- timeframeMonths: realistic for an early-stage startup. Don't overestimate speed.
- difficulty: based on the ambition level for the timeframe
- If it involves a partnership/deal/celebrity/investor, set dealType appropriately and fill theyGet/weGet/successCriteria
- For revenue targets: early stage = $5K-$100K MRR for 12-24mo
- For user targets: 1,000-50,000 for first 12mo
- For partnerships/celebs: 5-25 deals for 12-24mo
- For fundraising: $250K-$2M seed

CRITICAL: The target must be ONE hard number. If the founder said "5-10%", pick a single number and put the context in description/deal fields.`,
  });

  return new Response(JSON.stringify(result.object), {
    headers: { "Content-Type": "application/json" },
  });
}
