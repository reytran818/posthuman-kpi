import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 300;

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
        const { text } = await generateText({
          model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
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

FOUNDER: ${founder.name} (${founder.role}), ${founder.hoursPerWeek || 40} hrs/week

Respond ONLY with valid JSON:
{
  "name": "Short KPI name (2-5 words)",
  "description": "Clear description with hard numbers",
  "category": one of: "revenue", "product", "technical", "operations", "marketing", "fundraising", "leadership", "culture",
  "targetValue": number > 0,
  "unit": "countable noun (users, deals, dollars, partnerships, features)",
  "weight": number 1-100,
  "timeframeMonths": number 1-60,
  "difficulty": one of: "low", "medium", "high", "extreme",
  "dealType": one of: "standard", "equity_exchange", "investment", "revenue_share", "flat_fee" (optional),
  "theyGet": "string" (optional),
  "weGet": "string" (optional),
  "successCriteria": "string" (optional)
}

RULES:
- Keep the same intent — don't change what they're trying to achieve
- targetValue MUST be a single hard number (never 0, never a range)
- unit MUST be a countable noun — NEVER "5-10%" or percentage ranges
- Fix placeholder text like [set #], [TBD], [set date]
- Fix vague language ("some", "several", "try to")
- If it's a partnership/deal, set dealType and fill theyGet/weGet/successCriteria

Respond with ONLY the JSON object. No markdown, no explanation.`,
        });

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        updatedKPIs.push({
          ...kpi,
          ...parsed,
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
