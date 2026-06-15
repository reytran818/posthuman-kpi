"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Founder } from "@/lib/kpi-engine";
import {
  calculateEquitySplit,
  founderContributionValue,
  founderKPIScore,
  founderEnterpriseValue,
  EMPLOYEE_OPTION_POOL,
} from "@/lib/kpi-engine";
import { AlertTriangle, CheckCircle2, XCircle, TrendingUp, Users, Clock, Shield } from "lucide-react";

interface SanityCheckProps {
  founders: Founder[];
}

type Severity = "pass" | "warn" | "fail";

interface CheckResult {
  label: string;
  severity: Severity;
  detail: string;
}

export function SanityCheck({ founders }: SanityCheckProps) {
  const analysis = useMemo(() => {
    if (founders.length === 0) return null;

    const split = calculateEquitySplit(founders);
    const totalRequested = founders.reduce((s, f) => s + (f.requestedEquity || 0), 0);
    const founderPool = 100 - EMPLOYEE_OPTION_POOL;

    const equityResults = split.map((s) => {
      const f = founders.find((x) => x.id === s.founderId)!;
      const diff = s.equityPercent - (f.requestedEquity || 0);
      return { ...s, founder: f, diff };
    });

    const checks: CheckResult[] = [];

    // 1. Total equity check
    if (totalRequested > founderPool) {
      checks.push({ label: "Total Equity", severity: "fail", detail: `Requested ${totalRequested}% exceeds ${founderPool}% founder pool by ${(totalRequested - founderPool).toFixed(1)}%` });
    } else if (totalRequested > founderPool - 5) {
      checks.push({ label: "Total Equity", severity: "warn", detail: `Requested ${totalRequested}% — only ${(founderPool - totalRequested).toFixed(1)}% left for advisors/buffer` });
    } else {
      checks.push({ label: "Total Equity", severity: "pass", detail: `Requested ${totalRequested}% of ${founderPool}% pool — ${(founderPool - totalRequested).toFixed(1)}% remaining for advisors` });
    }

    // 2. Option pool
    checks.push({ label: "Employee Option Pool", severity: "pass", detail: `${EMPLOYEE_OPTION_POOL}% reserved — standard for seed stage` });

    // 3. Fairness deltas
    for (const r of equityResults) {
      if (Math.abs(r.diff) > 8) {
        checks.push({ label: `${r.founder.name} Equity Fairness`, severity: "fail", detail: `Algorithm: ${r.equityPercent.toFixed(1)}% vs requested ${r.founder.requestedEquity}% (Δ${r.diff > 0 ? "+" : ""}${r.diff.toFixed(1)}%)` });
      } else if (Math.abs(r.diff) > 5) {
        checks.push({ label: `${r.founder.name} Equity Fairness`, severity: "warn", detail: `Algorithm: ${r.equityPercent.toFixed(1)}% vs requested ${r.founder.requestedEquity}% (Δ${r.diff > 0 ? "+" : ""}${r.diff.toFixed(1)}%)` });
      } else {
        checks.push({ label: `${r.founder.name} Equity Fairness`, severity: "pass", detail: `Algorithm: ${r.equityPercent.toFixed(1)}% vs requested ${r.founder.requestedEquity}% (Δ${r.diff > 0 ? "+" : ""}${r.diff.toFixed(1)}%)` });
      }
    }

    // 4. Hours commitment
    for (const f of founders) {
      const hrs = f.hoursPerWeek || 0;
      if (hrs < 10 && (f.requestedEquity || 0) >= 10) {
        checks.push({ label: `${f.name} Hours`, severity: "fail", detail: `Only ${hrs}h/wk but requesting ${f.requestedEquity}% — investors will reject this` });
      } else if (hrs < 35 && (f.requestedEquity || 0) >= 15) {
        checks.push({ label: `${f.name} Hours`, severity: "warn", detail: `Part-time (${hrs}h/wk) requesting ${f.requestedEquity}% — should pro-rate or set full-time date` });
      } else {
        checks.push({ label: `${f.name} Hours`, severity: "pass", detail: `${hrs}h/wk — ${hrs >= 35 ? "full-time" : "part-time, equity reflects this"}` });
      }
    }

    // 5. Commitment status consistency — auto-derived from hours
    for (const f of founders) {
      const hrs = f.hoursPerWeek || 0;
      const correctStatus = hrs >= 35 ? "full_time" : "part_time";
      if (f.commitmentStatus && f.commitmentStatus !== correctStatus && f.commitmentStatus !== "student" && f.commitmentStatus !== "transitioning") {
        checks.push({ label: `${f.name} Status Mismatch`, severity: "warn", detail: `Marked "${f.commitmentStatus}" but ${hrs}h/wk → should be "${correctStatus}". Status auto-updates on next edit.` });
      }
    }

    // 6. KPI completeness
    for (const f of founders) {
      if (f.kpis.length === 0) {
        checks.push({ label: `${f.name} KPIs`, severity: "fail", detail: "No KPIs defined — cannot calculate equity contribution" });
      } else if (f.kpis.length < 3) {
        checks.push({ label: `${f.name} KPIs`, severity: "warn", detail: `Only ${f.kpis.length} KPI(s) — consider adding more to demonstrate full scope` });
      } else {
        checks.push({ label: `${f.name} KPIs`, severity: "pass", detail: `${f.kpis.length} KPIs defined` });
      }
    }

    // 7. Contributions / experience
    for (const f of founders) {
      const hasContribs = (f.contributions || []).length > 0;
      const hasExp = (f.yearsExperience || 0) > 0;
      if (!hasContribs && !hasExp) {
        checks.push({ label: `${f.name} Track Record`, severity: "warn", detail: "No contributions AND no experience logged — equity is 100% promise-based" });
      } else if (!hasContribs && hasExp) {
        checks.push({ label: `${f.name} Track Record`, severity: "warn", detail: `${f.yearsExperience}yr experience but no contributions documented — add past work` });
      } else {
        checks.push({ label: `${f.name} Track Record`, severity: "pass", detail: `${(f.contributions || []).length} contribution(s), ${f.yearsExperience || 0}yr experience` });
      }
    }

    // 8. KPI hard numbers validation
    for (const f of founders) {
      const vague = f.kpis.filter((k) => {
        const text = `${k.name} ${k.description}`;
        return /\[set|TBD|approximately|around|try to|aim to/i.test(text) || k.targetValue <= 0;
      });
      if (vague.length > 0) {
        checks.push({ label: `${f.name} KPI Quality`, severity: "fail", detail: `${vague.length} KPI(s) have vague language or invalid targets` });
      } else {
        checks.push({ label: `${f.name} KPI Quality`, severity: "pass", detail: "All KPIs have hard numbers" });
      }
    }

    // 9. Founder count
    if (founders.length > 4) {
      checks.push({ label: "Team Size", severity: "warn", detail: `${founders.length} founders — investors may see fragmentation risk. Typical is 2-4.` });
    } else {
      checks.push({ label: "Team Size", severity: "pass", detail: `${founders.length} founders — within normal range` });
    }

    // 10. Vesting
    checks.push({ label: "Vesting Schedule", severity: "pass", detail: "4-year vesting with 1-year cliff recommended (standard)" });

    // 10b. AI Commoditization — technical-heavy founders
    for (const f of founders) {
      const techKPIs = f.kpis.filter((k) => k.category === "technical");
      const totalKPIs = f.kpis.length;
      if (totalKPIs > 0 && techKPIs.length / totalKPIs > 0.6) {
        checks.push({ label: `${f.name} AI-Replaceable Risk`, severity: "warn", detail: `${techKPIs.length}/${totalKPIs} KPIs are "technical" — AI (Claude) can build most software now. Technical category scores at 0.9× vs revenue at 1.6×. Add non-technical KPIs or reframe as architecture/strategy.` });
      }
    }
    const totalTechKPIs = founders.reduce((s, f) => s + f.kpis.filter((k) => k.category === "technical").length, 0);
    const totalAllKPIs = founders.reduce((s, f) => s + f.kpis.length, 0);
    if (totalAllKPIs > 0 && totalTechKPIs / totalAllKPIs > 0.4) {
      checks.push({ label: "Company Technical Dependency", severity: "warn", detail: `${totalTechKPIs}/${totalAllKPIs} KPIs (${Math.round(totalTechKPIs/totalAllKPIs*100)}%) are technical — in the AI era, this is risky. Software is commoditized. Diversify into revenue, partnerships, and fundraising.` });
    } else if (totalAllKPIs > 0) {
      checks.push({ label: "AI Era Balance", severity: "pass", detail: `Technical KPIs are ${Math.round(totalTechKPIs/totalAllKPIs*100)}% of total — good balance. Algorithm weights human-only skills (revenue, fundraising, leadership) higher.` });
    }

    // 11. Revenue/fundraising coverage
    const hasRevenue = founders.some((f) => f.kpis.some((k) => k.category === "revenue"));
    const hasFundraising = founders.some((f) => f.kpis.some((k) => k.category === "fundraising"));
    if (!hasRevenue) {
      checks.push({ label: "Revenue Coverage", severity: "fail", detail: "No founder has revenue KPIs — who is making money?" });
    } else {
      checks.push({ label: "Revenue Coverage", severity: "pass", detail: "Revenue KPIs assigned" });
    }
    if (!hasFundraising) {
      checks.push({ label: "Fundraising Coverage", severity: "warn", detail: "No fundraising KPIs — who is raising capital?" });
    } else {
      checks.push({ label: "Fundraising Coverage", severity: "pass", detail: "Fundraising KPIs assigned" });
    }

    // 12. Skill overlap
    const skillOwners: Record<string, string[]> = {};
    for (const f of founders) {
      for (const skill of f.relevantSkills || []) {
        const norm = skill.toLowerCase().trim();
        if (!skillOwners[norm]) skillOwners[norm] = [];
        if (!skillOwners[norm].includes(f.name)) skillOwners[norm].push(f.name);
      }
    }
    const overlaps = Object.entries(skillOwners).filter(([, owners]) => owners.length > 1);
    if (overlaps.length > 3) {
      checks.push({ label: "Skills Overlap", severity: "warn", detail: `${overlaps.length} skills shared between founders — check for role confusion` });
    } else {
      checks.push({ label: "Skills Overlap", severity: "pass", detail: overlaps.length > 0 ? `${overlaps.length} shared skill(s) — minimal overlap` : "No skill overlap detected" });
    }

    // ═══ MATH VALIDATION ═══

    // 13. Total equity must = 100%
    const calculatedTotal = split.reduce((s, x) => s + x.equityPercent, 0) + EMPLOYEE_OPTION_POOL;
    if (Math.abs(calculatedTotal - 100) > 0.01) {
      checks.push({ label: "Math: Total = 100%", severity: "fail", detail: `Calculated equity totals ${calculatedTotal.toFixed(2)}% — should be exactly 100%. Algorithm error.` });
    } else {
      checks.push({ label: "Math: Total = 100%", severity: "pass", detail: `Founder pool (${(calculatedTotal - EMPLOYEE_OPTION_POOL).toFixed(1)}%) + ESOP (${EMPLOYEE_OPTION_POOL}%) = ${calculatedTotal.toFixed(1)}%` });
    }

    // 14. No negative equity
    const negativeEquity = split.filter((s) => s.equityPercent < 0);
    if (negativeEquity.length > 0) {
      checks.push({ label: "Math: No Negative Equity", severity: "fail", detail: `${negativeEquity.map(s => s.founderName).join(", ")} have negative calculated equity — algorithm error` });
    } else {
      checks.push({ label: "Math: No Negative Equity", severity: "pass", detail: "All founders have non-negative equity" });
    }

    // 15. No founder exceeds pool cap
    const overCap = split.filter((s) => s.equityPercent > founderPool);
    if (overCap.length > 0) {
      checks.push({ label: "Math: No Single Founder > Pool", severity: "fail", detail: `${overCap.map(s => `${s.founderName} (${s.equityPercent.toFixed(1)}%)`).join(", ")} exceeds the ${founderPool}% pool` });
    } else {
      checks.push({ label: "Math: No Single Founder > Pool", severity: "pass", detail: `No founder exceeds ${founderPool}% cap` });
    }

    // 16. KPI weights per founder — only flag disparity, not absolute values
    const founderWeights = founders.filter(f => f.kpis.length > 0).map(f => ({
      name: f.name,
      total: f.kpis.reduce((s, k) => s + k.weight, 0),
      count: f.kpis.length,
      max: f.kpis.reduce((m, k) => Math.max(m, k.weight), 0),
    }));
    const avgTotal = founderWeights.length > 0 ? founderWeights.reduce((s, fw) => s + fw.total, 0) / founderWeights.length : 0;

    for (const fw of founderWeights) {
      if (fw.max > 100) {
        checks.push({ label: `Math: ${fw.name} KPI Weight`, severity: "fail", detail: `Has a KPI with weight ${fw.max} — max allowed is 100` });
      } else if (fw.total > avgTotal * 1.4 && founderWeights.length > 1) {
        checks.push({ label: `Math: ${fw.name} KPI Weight`, severity: "warn", detail: `Total weights (${fw.total}) is ${Math.round((fw.total / avgTotal - 1) * 100)}% above team average (${Math.round(avgTotal)}). This may inflate their score relative to others. Consider normalizing weights so they represent priority within their own KPIs.` });
      } else if (fw.total < avgTotal * 0.6 && founderWeights.length > 1) {
        checks.push({ label: `Math: ${fw.name} KPI Weight`, severity: "warn", detail: `Total weights (${fw.total}) is ${Math.round((1 - fw.total / avgTotal) * 100)}% below team average (${Math.round(avgTotal)}). This deflates their score. Consider increasing weights on high-priority KPIs.` });
      } else {
        checks.push({ label: `Math: ${fw.name} KPI Weight`, severity: "pass", detail: `Total: ${fw.total} across ${fw.count} KPIs (avg ${Math.round(fw.total / fw.count)}/KPI) — within normal range` });
      }
    }

    // 17. KPI target values must be positive
    for (const f of founders) {
      const zeroTargets = f.kpis.filter((k) => k.targetValue <= 0);
      if (zeroTargets.length > 0) {
        checks.push({ label: `Math: ${f.name} Target Values`, severity: "fail", detail: `${zeroTargets.length} KPI(s) have target ≤ 0: ${zeroTargets.map(k => k.name).join(", ")}` });
      }
    }

    // 18. Timeframes must be valid (1-60 months)
    for (const f of founders) {
      const badTime = f.kpis.filter((k) => k.timeframeMonths < 1 || k.timeframeMonths > 60);
      if (badTime.length > 0) {
        checks.push({ label: `Math: ${f.name} Timeframes`, severity: "fail", detail: `${badTime.length} KPI(s) have invalid timeframes: ${badTime.map(k => `${k.name} (${k.timeframeMonths}mo)`).join(", ")}` });
      }
    }

    // 19. Contribution values must be non-negative
    for (const f of founders) {
      const badContribs = (f.contributions || []).filter((c) => c.estimatedValue < 0 || c.hoursInvested < 0);
      if (badContribs.length > 0) {
        checks.push({ label: `Math: ${f.name} Contributions`, severity: "fail", detail: `${badContribs.length} contribution(s) have negative values — fix estimated value or hours` });
      }
    }

    // 20. Requested equity per founder should be 0-50% (flag outliers)
    for (const f of founders) {
      const req = f.requestedEquity || 0;
      if (req > 50) {
        checks.push({ label: `Math: ${f.name} Request`, severity: "fail", detail: `Requesting ${req}% — no single founder should get >50% in a multi-founder startup` });
      } else if (req === 0 && f.kpis.length > 0) {
        checks.push({ label: `Math: ${f.name} Request`, severity: "warn", detail: `Has KPIs defined but requesting 0% equity — is this intentional?` });
      }
    }

    // 21. Bonus pool + locked equity shouldn't make total > 100%
    const totalLocked = founders.reduce((s, f) => s + (f.lockedEquity || 0), 0);
    const totalBonus = founders.reduce((s, f) => s + (f.bonusEquityEarned || 0), 0);
    const grandTotal = totalRequested + EMPLOYEE_OPTION_POOL + totalBonus;
    if (grandTotal > 100) {
      checks.push({ label: "Math: Grand Total ≤ 100%", severity: "fail", detail: `Requested (${totalRequested}%) + ESOP (${EMPLOYEE_OPTION_POOL}%) + Bonus awarded (${totalBonus}%) = ${grandTotal}% — exceeds 100%` });
    } else {
      checks.push({ label: "Math: Grand Total ≤ 100%", severity: "pass", detail: `Requested (${totalRequested}%) + ESOP (${EMPLOYEE_OPTION_POOL}%) + Bonus (${totalBonus}%) = ${grandTotal}% — within bounds` });
    }
    if (totalLocked > 0) {
      checks.push({ label: "Math: Locked Equity", severity: "pass", detail: `${totalLocked.toFixed(1)}% total locked across founders — this equity is permanently protected` });
    }

    // 22. Hours × equity ratio fairness (cost-per-percent)
    const hourEquityRatios = founders
      .filter((f) => (f.hoursPerWeek || 0) > 0 && (f.requestedEquity || 0) > 0)
      .map((f) => ({ name: f.name, ratio: (f.hoursPerWeek || 0) / (f.requestedEquity || 1) }));
    if (hourEquityRatios.length >= 2) {
      const maxRatio = Math.max(...hourEquityRatios.map((r) => r.ratio));
      const minRatio = Math.min(...hourEquityRatios.map((r) => r.ratio));
      if (maxRatio / minRatio > 5) {
        const cheap = hourEquityRatios.find((r) => r.ratio === minRatio)!;
        const expensive = hourEquityRatios.find((r) => r.ratio === maxRatio)!;
        checks.push({ label: "Math: Hours/Equity Ratio", severity: "fail", detail: `${expensive.name} works ${expensive.ratio.toFixed(1)}h per 1% vs ${cheap.name} at ${cheap.ratio.toFixed(1)}h per 1% — ${(maxRatio/minRatio).toFixed(1)}× difference is unfair` });
      } else if (maxRatio / minRatio > 3) {
        checks.push({ label: "Math: Hours/Equity Ratio", severity: "warn", detail: `Hours-per-percent varies ${(maxRatio/minRatio).toFixed(1)}× between founders — consider adjusting` });
      } else {
        checks.push({ label: "Math: Hours/Equity Ratio", severity: "pass", detail: `Hours-per-percent ratio is within ${(maxRatio/minRatio).toFixed(1)}× — reasonably balanced` });
      }
    }

    const passes = checks.filter((c) => c.severity === "pass").length;
    const warns = checks.filter((c) => c.severity === "warn").length;
    const fails = checks.filter((c) => c.severity === "fail").length;
    const score = Math.round((passes / checks.length) * 100);

    return { equityResults, checks, passes, warns, fails, score, totalRequested, founderPool };
  }, [founders]);

  if (!analysis || founders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Add founders and KPIs to run the sanity check.
      </div>
    );
  }

  const { equityResults, checks, passes, warns, fails, score } = analysis;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Sanity Check</h2>
        <p className="text-muted-foreground mt-1">
          Automated validation of equity fairness, KPI quality, and investor readiness.
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-4xl font-bold font-mono ${score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-destructive"}`}>
              {score}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-2xl font-bold text-green-500">{passes}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-500">{warns}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{fails}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Math Summary — always visible */}
      {(() => {
        const mathChecks = checks.filter((c) => c.label.startsWith("Math:"));
        const mathFails = mathChecks.filter((c) => c.severity === "fail");
        const mathWarns = mathChecks.filter((c) => c.severity === "warn");
        if (mathFails.length > 0 || mathWarns.length > 0) {
          return (
            <Card className={mathFails.length > 0 ? "border-destructive" : "border-yellow-500"}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  {mathFails.length > 0 ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <p className="font-bold text-sm">
                    {mathFails.length > 0
                      ? `⚠ ${mathFails.length} Math Error(s) — Numbers Don't Add Up`
                      : `${mathWarns.length} Math Warning(s) — Review Needed`}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[...mathFails, ...mathWarns].map((c, i) => (
                    <div key={i} className={`flex items-start gap-2 p-1.5 rounded text-xs ${c.severity === "fail" ? "bg-destructive/10" : "bg-yellow-500/10"}`}>
                      {c.severity === "fail" ? <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />}
                      <div>
                        <span className="font-medium">{c.label.replace("Math: ", "")}:</span>{" "}
                        <span className="text-muted-foreground">{c.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card className="border-green-500/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-bold text-sm text-green-600">All Math Checks Pass — Numbers Add Up</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total = 100% • No negative equity • All targets positive • Weights valid • Hours/equity ratio balanced
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Equity Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Equity: Algorithm vs Requested
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Founder</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium text-right">Hours/wk</th>
                  <th className="py-2 font-medium text-right">Experience</th>
                  <th className="py-2 font-medium text-right">Skills</th>
                  <th className="py-2 font-medium text-right">KPI Score</th>
                  <th className="py-2 font-medium text-right">Contrib Score</th>
                  <th className="py-2 font-medium text-right">Calculated</th>
                  <th className="py-2 font-medium text-right">Requested</th>
                  <th className="py-2 font-medium text-right">Delta</th>
                  <th className="py-2 font-medium text-center">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {equityResults.map((r) => {
                  const verdict = Math.abs(r.diff) <= 3 ? "FAIR" : r.diff > 0 ? "UNDER-ASKING" : "OVER-ASKING";
                  const verdictColor = verdict === "FAIR" ? "text-green-500" : verdict === "UNDER-ASKING" ? "text-blue-500" : "text-destructive";
                  return (
                    <tr key={r.founderId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{r.founderName}</td>
                      <td className="py-2 text-muted-foreground">{r.founder.role}</td>
                      <td className="py-2 text-right font-mono">{r.founder.hoursPerWeek || 0}</td>
                      <td className="py-2 text-right font-mono">{r.founder.yearsExperience || 0}yr</td>
                      <td className="py-2 text-right font-mono">{(r.founder.relevantSkills || []).length}</td>
                      <td className="py-2 text-right font-mono">{r.kpiScore.toFixed(0)}</td>
                      <td className="py-2 text-right font-mono">{r.contributionScore.toFixed(0)}</td>
                      <td className="py-2 text-right font-mono font-bold">{r.equityPercent.toFixed(1)}%</td>
                      <td className="py-2 text-right font-mono">{r.founder.requestedEquity || 0}%</td>
                      <td className={`py-2 text-right font-mono font-bold ${Math.abs(r.diff) > 5 ? "text-destructive" : ""}`}>
                        {r.diff > 0 ? "+" : ""}{r.diff.toFixed(1)}%
                      </td>
                      <td className={`py-2 text-center text-xs font-bold ${verdictColor}`}>{verdict}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Checks Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Detailed Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Show fails first, then warns, then passes */}
          {[...checks].sort((a, b) => {
            const order = { fail: 0, warn: 1, pass: 2 };
            return order[a.severity] - order[b.severity];
          }).map((check, i) => (
            <div key={i} className={`flex items-start gap-3 p-2 rounded ${
              check.severity === "fail" ? "bg-destructive/5" :
              check.severity === "warn" ? "bg-yellow-500/5" : "bg-green-500/5"
            }`}>
              {check.severity === "pass" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />}
              {check.severity === "warn" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}
              {check.severity === "fail" && <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* YC Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Investor Readiness (YC-Style)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Would Pass YC Interview?</p>
              {score >= 80 ? (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Likely Yes</Badge>
              ) : score >= 60 ? (
                <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Needs Work</Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive">Not Yet</Badge>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Cap Table Cleanliness</p>
              {fails === 0 ? (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Clean</Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive">{fails} issue(s) to fix</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Key Concerns for Investors:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {fails > 0 && (
                <p className="text-destructive">• {fails} critical issue(s) must be resolved before pitching</p>
              )}
              {founders.filter((f) => (f.hoursPerWeek || 0) < 35 && (f.requestedEquity || 0) >= 15).length > 0 && (
                <p>• Part-time founders with significant equity will be questioned</p>
              )}
              {founders.filter((f) => (f.contributions || []).length === 0).length > 2 && (
                <p>• Most founders have no documented past work — investors want proof of execution</p>
              )}
              {founders.length > 4 && (
                <p>• {founders.length} founders is unusual — be ready to explain why each is essential</p>
              )}
              {equityResults.some((r) => Math.abs(r.diff) > 8) && (
                <p>• Large gaps between algorithm and requests signal misaligned expectations</p>
              )}
              {passes === checks.length && (
                <p className="text-green-500">All checks passing — cap table is defensible</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Hours Commitment Summary:</p>
            <div className="grid grid-cols-5 gap-2">
              {founders.map((f) => (
                <div key={f.id} className="p-2 bg-muted rounded text-center">
                  <p className="text-xs font-medium truncate">{f.name.split(" ")[0]}</p>
                  <p className="font-mono text-sm font-bold">{f.hoursPerWeek || 0}h</p>
                  <p className="text-xs text-muted-foreground">{f.commitmentStatus || "unknown"}</p>
                  <div className="mt-1 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(f.hoursPerWeek || 0) >= 35 ? "bg-green-500" : (f.hoursPerWeek || 0) >= 20 ? "bg-yellow-500" : "bg-destructive"}`}
                      style={{ width: `${Math.min(100, ((f.hoursPerWeek || 0) / 40) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Experience &amp; Mission Alignment Impact:
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Posthuman builds AI health devices. Skills in AI/ML, healthcare, medical devices, IoT, security, and FDA compliance get a mission bonus.
            </p>
            <div className="text-xs space-y-1">
              {founders.map((f) => {
                const yrs = f.yearsExperience || 0;
                const mult = 1 + Math.min(yrs, 20) / 40;
                const skills = f.relevantSkills || [];
                const missionKeywords = ["health", "medical", "clinical", "hipaa", "fda", "device", "iot", "hardware", "sensor", "ai", "ml", "machine learning", "security", "cybersecurity", "pen test", "data pipeline", "cloud", "interoperability", "hl7", "snomed", "loinc", "firmware", "embedded", "wearable", "biotech", "peptide"];
                const missionAligned = skills.filter((s) => missionKeywords.some((kw) => s.toLowerCase().includes(kw))).length;
                const baseMult = 1 + Math.min(skills.length, 15) * 0.02;
                const missionBonus = Math.min(missionAligned, 10) * 0.03;
                const skillsMult = baseMult + missionBonus;
                return (
                  <div key={f.id} className="flex items-center gap-2 flex-wrap">
                    <span className="w-28 truncate font-medium">{f.name}</span>
                    <span className="font-mono text-muted-foreground">{yrs}yr → {mult.toFixed(2)}x exp</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-mono text-muted-foreground">{skills.length} skills ({missionAligned} mission-aligned) → {skillsMult.toFixed(2)}x</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-mono font-bold">Total: {(mult * skillsMult).toFixed(2)}x</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
