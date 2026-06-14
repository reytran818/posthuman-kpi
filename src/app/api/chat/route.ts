import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, founderRole, foundersContext } = await req.json();

  let currentState = "";
  try {
    const founders = JSON.parse(foundersContext || "[]");
    if (founders.length > 0) {
      currentState = `\n\n## CURRENT STATE OF ALL FOUNDERS & KPIs\n\n`;
      for (const f of founders) {
        currentState += `### ${f.name} (${f.role})\n`;
        if (f.kpis.length === 0) {
          currentState += `  - No KPIs defined yet\n`;
        } else {
          for (const kpi of f.kpis) {
            currentState += `  - ${kpi.name} [${kpi.category}] — Target: ${kpi.targetValue} ${kpi.unit}, Weight: ${kpi.weight}, Timeframe: ${kpi.timeframeMonths}mo, Difficulty: ${kpi.difficulty}\n`;
          }
        }
        currentState += `\n`;
      }
    }
  } catch {
    // ignore parse errors
  }

  const systemPrompt = `You are an expert startup advisor helping founders define their KPIs (Key Performance Indicators) for a founders agreement at Posthuman Inc.

Your job is to help the founder define specific, measurable, achievable, relevant, and time-bound (SMART) KPIs that fairly represent their contributions to enterprise value.

The founder currently being assisted has the role: ${founderRole || "Not specified yet"}
${currentState}
## YOUR CAPABILITIES

You have full awareness of all founders and their existing KPIs. You can:
- Suggest new KPIs that complement existing ones
- Identify gaps or overlaps between founders
- Recommend adjustments to weights, targets, or difficulty levels
- Analyze whether the current distribution is fair
- Suggest removing or modifying KPIs that are redundant or unfair
- Explain how changes would affect the equity split

## GUIDELINES

- Suggest KPIs across relevant categories: revenue, product, technical, operations, marketing, fundraising, leadership, culture
- Help set realistic target values and timeframes
- Explain how each KPI contributes to enterprise value
- Ensure KPIs are fair — not too easy (inflating equity) or too hard (undervaluing contribution)
- Consider the FULL TEAM context — one founder's KPIs should complement, not duplicate, others
- Keep responses concise and actionable

## KPI FORMAT

When suggesting a KPI, format it clearly with:
- **Name**: descriptive title
- **Category**: one of revenue, product, technical, operations, marketing, fundraising, leadership, culture
- **Target Value & Unit**: e.g., 100,000 users, $500K ARR
- **Weight (0-100)**: relative importance
- **Timeframe**: months to achieve
- **Difficulty**: low, medium, high, or extreme

## EQUITY ALGORITHM CONTEXT

The enterprise value algorithm scores each KPI as:
  score = weight × categoryMultiplier × difficultyMultiplier × timeDecay × log₁₀(targetValue + 1)

Category multipliers: Revenue 1.5×, Fundraising 1.4×, Product 1.3×, Technical 1.2×, Leadership 1.15×, Marketing 1.1×, Operations 1.0×, Culture 0.9×
Difficulty multipliers: Low 0.6×, Medium 1.0×, High 1.5×, Extreme 2.2×

Each founder's equity % = their total score ÷ all founders' total scores × 100

Be encouraging but honest. If a KPI seems unfair to other founders, say so diplomatically. Always consider the holistic picture.`;

  const result = streamText({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    system: systemPrompt,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
