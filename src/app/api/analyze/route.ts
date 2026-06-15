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

  const totalRequestedEquity = founders.reduce(
    (sum: number, f: Record<string, unknown>) => sum + ((f.requestedEquity as number) || 0),
    0
  );

  let context = `## CURRENT FOUNDER DATA (${founders.length} founders)\n`;
  context += `Total equity requested across all founders: ${totalRequestedEquity}%\n`;
  context += `Remaining for option pool / future hires: ${Math.max(0, 100 - totalRequestedEquity)}%\n\n`;

  for (const f of founders) {
    context += `### ${f.name} (${f.role}) — ${f.hoursPerWeek || 0} hrs/week`;
    if (f.requestedEquity) context += ` — REQUESTING ${f.requestedEquity}%`;
    if (f.commitmentStatus && f.commitmentStatus !== "full_time") {
      context += ` — ⚠️ ${f.commitmentStatus.toUpperCase()}`;
      if (f.fullTimeDate) context += ` (full-time by ${f.fullTimeDate})`;
    }
    context += `\n`;

    if (f.resume) context += `  Background: ${f.resume.substring(0, 400)}\n`;
    if (f.yearsExperience) context += `  Experience: ${f.yearsExperience} years\n`;
    if (f.relevantSkills?.length > 0) {
      context += `  Skills: ${f.relevantSkills.join(", ")}\n`;
    }

    if (f.contributions?.length > 0) {
      context += `  Prior Contributions (${f.contributions.length}):\n`;
      for (const c of f.contributions) {
        context += `    - [${c.type}] ${c.description} (${c.hoursInvested}h invested, $${c.estimatedValue} value)\n`;
      }
    }

    if (f.kpis?.length > 0) {
      context += `  KPIs (${f.kpis.length}):\n`;
      for (const k of f.kpis) {
        context += `    - ${k.name}: ${k.targetValue} ${k.unit} in ${k.timeframeMonths}mo`;
        context += ` [category:${k.category}, weight:${k.weight}, difficulty:${k.difficulty}`;
        if (k.status) context += `, status:${k.status}`;
        if (k.deadline) context += `, deadline:${k.deadline}`;
        context += `]`;
        if (k.dealType && k.dealType !== "standard") {
          context += ` {deal:${k.dealType}`;
          if (k.theyGet) context += `, they_get:"${k.theyGet}"`;
          if (k.weGet) context += `, we_get:"${k.weGet}"`;
          if (k.successCriteria) context += `, success:"${k.successCriteria}"`;
          context += `}`;
        }
        context += `\n`;
        if (k.description) context += `      "${k.description}"\n`;
      }
    } else {
      context += `  ⚠️ NO KPIs DEFINED\n`;
    }

    if (f.warnings?.length > 0) {
      context += `  ⚠️ WARNINGS (${f.warnings.length}):\n`;
      for (const w of f.warnings) {
        context += `    - ${w.reason} (${new Date(w.date).toLocaleDateString()})\n`;
      }
    }
    if (f.vestingPaused) context += `  🛑 VESTING PAUSED since ${f.vestingPausedDate || "unknown"}\n`;
    if (f.causeTermination) context += `  ❌ CAUSE TERMINATION DECLARED\n`;
    if (f.bonusEquityEarned) context += `  🏆 Bonus earned: ${f.bonusEquityEarned}%\n`;
    if (f.bonusMilestones?.length > 0) {
      for (const bm of f.bonusMilestones) {
        context += `    - Bonus: ${bm.description} (+${bm.equityAmount}% on ${bm.earnedDate})\n`;
      }
    }
    if (f.equityMilestones?.length > 0) {
      const locked = f.equityMilestones.filter((m: Record<string, unknown>) => m.achieved);
      const pending = f.equityMilestones.filter((m: Record<string, unknown>) => !m.achieved);
      if (locked.length > 0) {
        context += `  🔒 LOCKED EQUITY (${(f.lockedEquity || 0)}% permanently locked):\n`;
        for (const m of locked) {
          context += `    - ✅ ${m.kpiName}: ${m.targetValue} ${m.unit} → ${m.equityPercent}% locked (${m.achievedDate})\n`;
        }
      }
      if (pending.length > 0) {
        context += `  🎯 Pending lock-in milestones:\n`;
        for (const m of pending) {
          context += `    - ${m.kpiName}: ${m.targetValue} ${m.unit} → will lock ${m.equityPercent}%\n`;
        }
      }
    }
    context += `\n`;
  }

  const result = streamText({
    model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
    system: `You are the AI equity analyst for Posthuman Inc. Auto-analyze ALL founder data and provide a comprehensive, actionable update.

## CALCULATION METHOD (use this exactly)

Equity formula: (founderScore / totalAllScores) × 100%

founderScore = (KPI_value × 0.7) + (prior_contribution_value × 0.3)

KPI_value per KPI = weight × category_multiplier × difficulty_multiplier × time_decay × log10(targetValue+1)
  Category multipliers: revenue=1.5, fundraising=1.4, product=1.3, technical=1.2, marketing=1.1, operations=1.0, leadership=1.15, culture=0.9
  Difficulty multipliers: low=0.6, medium=1.0, high=1.5, extreme=2.2
  Time decay: 0.85^(months/12) — shorter timeframes = more valuable

Prior contribution value = sum of (type_weight × log2(hours+1) × log10($value+1) × 10) + experience_bonus
  Type weights: execution=1.0, technical_build=0.95, revenue_generated=0.9, capital_invested=0.85, ip_created=0.8, domain_expertise=0.7, team_recruited=0.65, network_connections=0.5, market_research=0.4, idea_vision=0.3
  Experience bonus: log2(years+1) × 5

Hours adjustment: Scale equity proportionally by (hours/40) for part-time founders.

## FORMAT YOUR RESPONSE EXACTLY AS:

**Equity Split (calculated):**
[Each founder: Name — X.X% (their requested: Y%) — verdict: FAIR / OVER / UNDER with 1-line reason]

**Total Equity Allocated:** X% of 100%
**Option Pool Remaining:** X%

**Red Flags:**
[Numbered list. Include: vague KPIs, placeholder text, unfair requests, missing data, commitment gaps, overlapping responsibilities, total equity >100%]

**Accountability Status:**
[Any warnings, vesting pauses, or cause terminations — or "All clear"]

**Bonus Pool (5% total):**
[Awarded so far: X% / Remaining: X% — any pending triggers?]

**Action Items (by priority):**
1. [Most urgent — what needs to happen THIS WEEK]
2. [...]
3. [...]

**Investor Readiness:**
[1-sentence: Would YC/investors accept this cap table as-is? What's the #1 fix?]

## RULES:
- Be BLUNT. If someone is asking for more than they deserve, say so with numbers.
- If total requested equity > 85%, flag it — need option pool for employees/advisors.
- Part-time (< 35 hrs/week) founders should get proportionally less.
- Ideas alone (idea_vision) are worth 0.3x execution. Don't reward "I had the idea" without delivery.
- KPIs with placeholder text like [set #], [TBD], [set date], or vague words like "some" or "multiple" are INVALID — flag them.
- Deal-type KPIs (equity_exchange, investment) need clear success criteria or they're worthless.
- Compare requested equity vs calculated equity. Difference > 5% = unfair.
- Founders with 0 KPIs get 0% in calculations. Flag this loudly.
- 5% bonus pool exists for above-plan achievements (user growth, celebrity deals, investor intros).
- Milestone lock-ins: founders can permanently lock equity by hitting hard targets. Locked equity survives even bad-leaver departure. Report locked vs unlocked for each founder.
- Always end with ONE concrete number the team should discuss.`,
    messages: [
      {
        role: "user",
        content: `Analyze this founder data and provide the full auto-update:\n\n${context}`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
