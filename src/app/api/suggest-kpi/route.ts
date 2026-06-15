import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { actionItem, role, existingKPIs } = await req.json();

  if (!actionItem) {
    return new Response(JSON.stringify({ error: "Action item required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text } = await generateText({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    prompt: `You are the equity calculator for Posthuman Inc., an early-stage startup.

A founder with role "${role || "Founder"}" described their action item:
"${actionItem}"

${existingKPIs ? `They already have these KPIs: ${existingKPIs}` : ""}

Convert this into a structured KPI with HARD NUMBERS. Respond ONLY with valid JSON, no other text.

JSON schema:
{
  "name": "Short KPI name (2-5 words)",
  "description": "Clear description of what success looks like",
  "category": one of: "revenue", "product", "technical", "operations", "marketing", "fundraising", "leadership", "culture",
  "targetValue": number (hard target, must be > 0, never a range),
  "unit": "countable noun like users, deals, dollars, partnerships",
  "weight": number 1-100 (importance to company value),
  "timeframeMonths": number 1-60,
  "difficulty": one of: "low", "medium", "high", "extreme",
  "dealType": one of: "standard", "equity_exchange", "investment", "revenue_share", "flat_fee" (optional, use if it's a deal/partnership),
  "theyGet": "what other party gets" (optional),
  "weGet": "what Posthuman gets" (optional),
  "successCriteria": "how to verify achievement" (optional),
  "reasoning": "1-2 sentence explanation of numbers"
}

RULES:
- targetValue MUST be a specific number — never 0, never a range
- unit must be a countable noun — NEVER "5-10%" or percentage ranges
- weight: revenue/fundraising = 70-100, product = 50-80, marketing = 40-70, culture = 20-40
- If it involves a partnership/deal/celebrity/investor, set dealType and fill theyGet/weGet/successCriteria
- For revenue: early stage $5K-$100K MRR for 12-24mo
- For users: 1,000-50,000 first 12mo
- For partnerships: 5-25 deals for 12-24mo
- For fundraising: $250K-$2M seed

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON.`,
  });

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
