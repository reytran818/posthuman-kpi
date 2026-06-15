import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { actionItem, role, existingKPIs } = await req.json();

    if (!actionItem) {
      return new Response(JSON.stringify({ error: "Action item required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = streamText({
      model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
      prompt: `Convert this founder action item into a structured KPI with hard numbers for an early-stage startup called Posthuman Inc.

Founder role: ${role || "Founder"}
Action item: "${actionItem}"
${existingKPIs ? `Existing KPIs: ${existingKPIs}` : ""}

Return ONLY a JSON object with these exact fields (no other text, no markdown, no explanation):
{"name":"short name 2-5 words","description":"what success looks like","category":"one of: revenue/product/technical/operations/marketing/fundraising/leadership/culture","targetValue":1000,"unit":"countable noun like users or deals or dollars","weight":50,"timeframeMonths":12,"difficulty":"one of: low/medium/high/extreme","reasoning":"why these numbers"}

If it involves a deal or partnership, also include: "dealType":"equity_exchange or investment or revenue_share or flat_fee","theyGet":"what they get","weGet":"what we get","successCriteria":"how to verify"

Rules: targetValue must be >0 single number. unit must be countable noun never a percentage. weight 1-100 based on value to company. Return ONLY the JSON.`,
    });

    return result.toTextStreamResponse();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
