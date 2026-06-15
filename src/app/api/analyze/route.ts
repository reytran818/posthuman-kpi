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
  context += `Employee Option Pool: 10% (reserved for future hires)\n`;
  context += `Founder Pool: 90% (split among founders based on KPIs + contributions)\n`;
  context += `Total equity requested across all founders: ${totalRequestedEquity}%\n`;
  context += `Remaining for advisors/buffer: ${Math.max(0, 90 - totalRequestedEquity)}%\n\n`;

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

## COMPANY MISSION
Posthuman Inc. builds AI-powered smart devices that track people's health and help them live better. This is a HEALTH TECH + HARDWARE + AI company.

Skills that directly support this mission get extra algorithmic weight:
- AI/ML, healthcare software, medical devices, FDA validation, HIPAA, IoT, sensors, hardware, firmware, clinical data, biotech
- The algorithm gives up to +30% bonus for mission-aligned skills (0.03× per aligned skill, max 10)

When evaluating founders, ask: "Does this person's background directly help build AI health devices?" If YES, their skills multiplier will be higher.

## CALCULATION METHOD (use this exactly)

Equity formula: (founderScore / totalAllScores) × 90% (founder pool)

founderScore = ((KPI_value × 0.7) + (contribution_value × 0.3)) × skills_multiplier

KPI_value per KPI = weight × category_multiplier × difficulty_multiplier × time_decay × log10(targetValue+1)
  Category multipliers (AI-adjusted for 2026):
    revenue=1.6, fundraising=1.5, leadership=1.3, marketing=1.2, product=1.1, operations=1.0, technical=0.9, culture=0.85
  WHY: AI (Claude) can build software now. Code is commoditized. Human-only skills (deals, capital, relationships, strategy) are worth MORE.
  Difficulty multipliers: low=0.6, medium=1.0, high=1.5, extreme=2.2
  Time decay: 0.85^(months/12) — shorter timeframes = more valuable

Contribution_value = (base_contributions + experience_base) × experience_multiplier
  base_contributions = sum of (type_weight × log2(hours+1) × log10($value+1) × 10) per contribution
  Type weights (AI-era adjusted): revenue_generated=1.0, execution=0.95, capital_invested=0.9, team_recruited=0.85, network_connections=0.8, domain_expertise=0.75, ip_created=0.7, technical_build=0.6, market_research=0.5, idea_vision=0.3
  NOTE: technical_build is 0.6 (not 1.0) because AI can write code now. Building software is no longer scarce. Relationships, revenue, and capital are.
  experience_base = log2(years+1) × 15  — standalone credit for years in industry
  experience_multiplier = 1 + (min(years, 20) / 40) — up to 1.5x for 20+ years of experience
  Example: 10yr veteran gets 1.25x multiplier; 20yr veteran gets 1.5x

Skills_multiplier = 1 + (min(skills_count, 15) × 0.02) — up to 1.3x for 15+ relevant skills
  Relevant skills signal domain expertise and increase KPI delivery probability.

Hours adjustment: KPI scores are discounted by sqrt(hours/40) for part-time founders.
  40h/wk = 1.0× | 20h/wk = 0.71× | 16h/wk = 0.63× | 10h/wk = 0.5× | 5h/wk = 0.35×
  This applies to KPI score ONLY (promises). Contribution score (past work) is not affected.
  Rationale: A part-timer has less time to deliver — their promises should be discounted.

## EXPERIENCE FAIRNESS RULES:
- A founder with 15+ years industry experience brings institutional knowledge that de-risks the company — weight this.
- Experience WITHOUT execution (no contributions, no KPIs) is worth less. Experience multiplies contributions, not replaces them.
- Two founders with identical KPIs but different experience: the experienced one gets more because they're more likely to deliver.
- A new grad (0-2 years) vs a seasoned executive (15+ years) requesting the same equity is a RED FLAG unless the new grad has extreme execution velocity.
- Skills overlap between founders reduces the marginal value of redundant expertise — flag this.
- Always show "Experience Factor" in your equity breakdown so founders can see how experience affected the calculation.

## FORMAT YOUR RESPONSE EXACTLY AS:

**Equity Split (calculated):**
[Each founder: Name — X.X% (requested: Y%) — Experience: Z yrs (×M multiplier, N skills) — verdict: FAIR / OVER / UNDER with 1-line reason]

**Total Equity Allocated:** X% of 90% founder pool
**Employee Option Pool:** 10% (reserved)

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
- If total requested equity > 85%, flag it — need room for advisors within the 90% founder pool. 10% employee option pool is already reserved separately.
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
