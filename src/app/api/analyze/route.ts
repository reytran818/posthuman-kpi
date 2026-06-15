import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { founders } = await req.json();

  if (!founders || founders.length === 0) {
    return new Response(JSON.stringify({ analysis: "No founder data to analyze." }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let context = "## CURRENT FOUNDER DATA\n\n";
  for (const f of founders) {
    context += `### ${f.name} (${f.role}) — ${f.hoursPerWeek || 0} hrs/week`;
    if (f.requestedEquity) context += ` — REQUESTING ${f.requestedEquity}%`;
    context += `\n`;
    if (f.resume) context += `  Background: ${f.resume.substring(0, 300)}\n`;
    if (f.kpis?.length > 0) {
      context += `  KPIs (${f.kpis.length}):\n`;
      for (const k of f.kpis) {
        context += `    - ${k.name}: ${k.targetValue} ${k.unit} in ${k.timeframeMonths}mo (weight:${k.weight}, ${k.difficulty})`;
        if (k.dealType && k.dealType !== "standard") context += ` [${k.dealType}]`;
        context += `\n`;
        if (k.description) context += `      "${k.description}"\n`;
      }
    }
    if (f.futureContributions?.length > 0) {
      context += `  Future Contributions:\n`;
      for (const fc of f.futureContributions) {
        context += `    - ${fc.description} (${fc.targetValue} ${fc.unit} by ${fc.deadline}) [${fc.status || "planned"}]\n`;
      }
    }
    if (f.warnings?.length > 0) {
      context += `  ⚠️ WARNINGS (${f.warnings.length}):\n`;
      for (const w of f.warnings) {
        context += `    - ${w.reason} (${new Date(w.date).toLocaleDateString()})\n`;
      }
    }
    if (f.vestingPaused) context += `  🛑 VESTING PAUSED\n`;
    if (f.bonusEquityEarned) context += `  🏆 Bonus earned: ${f.bonusEquityEarned}%\n`;
    context += `\n`;
  }

  const result = streamText({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    system: `You are an AI equity analyst for Posthuman Inc. Auto-analyze the founder data and provide a concise, actionable update.

FORMAT YOUR RESPONSE EXACTLY AS:

**Equity Split (calculated):**
[List each founder with their calculated fair % based on hours, KPIs, difficulty, and contributions]

**Red Flags:**
[List any issues: vague KPIs, unfair splits, missing data, commitment concerns]

**Action Items:**
[Top 3-5 things that need to be decided or fixed RIGHT NOW]

**Changes Since Last Review:**
[Note anything that looks new or modified]

RULES:
- Be direct, not diplomatic. If something is unfair, say so.
- Hard numbers only. No vague advice.
- Equity should be proportional to: hours committed × KPI value × difficulty × prior contributions
- 5% bonus pool exists for above-plan results
- Part-time founders get proportionally less
- Flag any KPIs with placeholder text like [set #] or [set date]`,
    messages: [
      {
        role: "user",
        content: `Analyze this founder data and provide your auto-update:\n\n${context}`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
