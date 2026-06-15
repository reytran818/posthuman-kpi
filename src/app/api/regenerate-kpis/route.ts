import { streamText } from "ai";
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
        const result = streamText({
          model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
          prompt: `Regenerate this KPI with proper hard numbers. Keep the same intent. Fix vague language or placeholders.

KPI for ${founder.name} (${founder.role}, ${founder.hoursPerWeek || 40}hrs/week):
- Name: "${kpi.name}"
- Description: "${kpi.description || ""}"
- Category: ${kpi.category}, Target: ${kpi.targetValue} ${kpi.unit}
- Weight: ${kpi.weight}, Timeframe: ${kpi.timeframeMonths}mo, Difficulty: ${kpi.difficulty}
${kpi.dealType && kpi.dealType !== "standard" ? `- Deal: ${kpi.dealType}` : ""}

Return ONLY JSON: {"name":"2-5 words","description":"clear","category":"revenue/product/technical/operations/marketing/fundraising/leadership/culture","targetValue":1000,"unit":"countable noun","weight":50,"timeframeMonths":12,"difficulty":"low/medium/high/extreme"}
If deal include: "dealType":"...","theyGet":"...","weGet":"...","successCriteria":"..."
Rules: targetValue>0, unit=countable noun never %. Return ONLY JSON.`,
        });

        // Collect stream into text
        const stream = result.textStream;
        let text = "";
        for await (const chunk of stream) {
          text += chunk;
        }

        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          updatedKPIs.push({ ...kpi, ...parsed, id: kpi.id });
        } else {
          updatedKPIs.push(kpi);
        }
      } catch {
        updatedKPIs.push(kpi);
      }
    }

    updatedFounders.push({ ...founder, kpis: updatedKPIs });
  }

  return new Response(JSON.stringify({ founders: updatedFounders }), {
    headers: { "Content-Type": "application/json" },
  });
}
