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

    // 5. Commitment status consistency
    for (const f of founders) {
      if (f.commitmentStatus === "full_time" && (f.hoursPerWeek || 0) < 30) {
        checks.push({ label: `${f.name} Status Mismatch`, severity: "fail", detail: `Marked "full-time" but only ${f.hoursPerWeek}h/wk — fix one or the other` });
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
              Experience Impact on Equity:
            </p>
            <div className="text-xs space-y-1">
              {founders.map((f) => {
                const yrs = f.yearsExperience || 0;
                const mult = 1 + Math.min(yrs, 20) / 40;
                const skillsMult = 1 + Math.min((f.relevantSkills || []).length, 15) * 0.02;
                return (
                  <div key={f.id} className="flex items-center gap-2">
                    <span className="w-28 truncate font-medium">{f.name}</span>
                    <span className="font-mono text-muted-foreground">{yrs}yr → {mult.toFixed(2)}x</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-mono text-muted-foreground">{(f.relevantSkills || []).length} skills → {skillsMult.toFixed(2)}x</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-mono font-bold">Combined: {(mult * skillsMult).toFixed(2)}x</span>
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
