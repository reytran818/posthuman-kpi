import { generateObject } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { name, description, category, timeframeMonths, role, difficulty } = await req.json();

  if (!name) {
    return new Response(JSON.stringify({ error: "KPI name required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await generateObject({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    schema: z.object({
      targetValue: z.number().describe("The hard number target"),
      unit: z.string().describe("Measurable unit (e.g., users, dollars, deals, downloads)"),
      weight: z.number().min(1).max(100).describe("Importance weight 1-100"),
      difficulty: z.enum(["low", "medium", "high", "extreme"]).describe("How hard this is to achieve"),
      reasoning: z.string().describe("1-sentence explanation of why these numbers"),
    }),
    prompt: `You are an equity analyst for Posthuman Inc., an early-stage startup.

A founder with role "${role || "Founder"}" is defining a KPI:
- Name: "${name}"
- Description: "${description || "not provided"}"
- Category: ${category || "product"}
- Timeframe: ${timeframeMonths || 12} months
- Difficulty (if set): ${difficulty || "not set"}

Generate appropriate hard numbers for this KPI.

RULES:
- targetValue must be a realistic but ambitious number for an early-stage startup
- unit must be a countable noun (users, dollars, deals, partnerships, features) — NEVER a percentage range like "5-10%"
- weight reflects how much this KPI matters to company value (revenue/fundraising KPIs = 70-100, product = 50-80, culture = 20-40)
- difficulty should match the ambition level for the timeframe
- For revenue: early stage targets should be $5K-$100K MRR range for 12-24mo
- For users: target 1,000-50,000 for first 12mo depending on product type
- For partnerships: 5-50 deals for 12-24mo
- For fundraising: $250K-$2M for seed stage
- Be specific. No vague targets. These numbers determine equity allocation.`,
  });

  return new Response(JSON.stringify(result.object), {
    headers: { "Content-Type": "application/json" },
  });
}
