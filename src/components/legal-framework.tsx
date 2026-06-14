"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { Founder } from "@/lib/kpi-engine";
import {
  modelDilution,
  generateVestingMilestones,
  calculateEquitySplit,
  DEPARTURE_SCENARIOS,
  DECISION_RIGHTS,
  CONFLICT_RESOLUTION,
  PROTECTIVE_CLAUSES,
  COMPENSATION_FRAMEWORK,
} from "@/lib/kpi-engine";
import {
  Shield,
  Scale,
  TrendingDown,
  Gavel,
  Users,
  Lock,
  FileText,
  DollarSign,
  Clock,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface LegalFrameworkProps {
  founders: Founder[];
}

export function LegalFramework({ founders }: LegalFrameworkProps) {
  const dilution = modelDilution(founders);
  const equitySplit = calculateEquitySplit(founders);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Legal & Protective Framework
        </h2>
        <p className="text-muted-foreground mt-1">
          Standard clauses that protect the company and all founders. These are
          non-negotiable for any investor-ready agreement.
        </p>
      </div>

      {/* Dilution Modeling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Dilution Modeling — Your Equity Through Funding Rounds
          </CardTitle>
          <CardDescription>
            How founder ownership decreases as the company raises capital (this is
            normal and expected)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Founder</th>
                  <th className="text-center py-2 font-medium">Today</th>
                  <th className="text-center py-2 font-medium">
                    After Seed
                    <span className="block text-xs text-muted-foreground font-normal">$1.5M @ $5M pre</span>
                  </th>
                  <th className="text-center py-2 font-medium">
                    After Series A
                    <span className="block text-xs text-muted-foreground font-normal">$8M @ $25M pre</span>
                  </th>
                  <th className="text-center py-2 font-medium">
                    After Series B
                    <span className="block text-xs text-muted-foreground font-normal">$30M @ $100M pre</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dilution.founderPaths.map((fp) => (
                  <tr key={fp.founderName} className="border-b border-border/50">
                    <td className="py-3 font-medium">{fp.founderName}</td>
                    <td className="text-center font-mono">{fp.initialEquity}%</td>
                    <td className="text-center font-mono text-yellow-500">{fp.afterSeed}%</td>
                    <td className="text-center font-mono text-orange-500">{fp.afterSeriesA}%</td>
                    <td className="text-center font-mono text-destructive">{fp.afterSeriesB}%</td>
                  </tr>
                ))}
                <tr className="border-b border-border/50 bg-muted/50">
                  <td className="py-3 font-medium">ESOP</td>
                  <td className="text-center font-mono">15%</td>
                  <td className="text-center font-mono">~20%</td>
                  <td className="text-center font-mono">~25%</td>
                  <td className="text-center font-mono">~28%</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="py-3 font-medium">Investors (cumulative)</td>
                  <td className="text-center font-mono">0%</td>
                  <td className="text-center font-mono">~23%</td>
                  <td className="text-center font-mono">~40%</td>
                  <td className="text-center font-mono">~55%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Key insight:</p>
            <p>
              Dilution is normal. At Series B, a founder with 40% today would own ~15-20% — but that 15% of a
              $130M company ($19.5M) is far more valuable than 40% of a $0 company. Focus on growing the pie,
              not protecting your slice.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Good Leaver / Bad Leaver */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Departure Scenarios — Good Leaver vs Bad Leaver
          </CardTitle>
          <CardDescription>
            What happens to equity when a founder leaves. These terms must be agreed
            upfront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEPARTURE_SCENARIOS.map((scenario) => (
            <div
              key={scenario.type}
              className={`p-4 rounded-lg border ${
                scenario.type === "bad_leaver"
                  ? "border-destructive/40 bg-destructive/5"
                  : scenario.type === "voluntary_early"
                  ? "border-yellow-500/40 bg-yellow-500/5"
                  : scenario.type === "death_disability"
                  ? "border-blue-500/40 bg-blue-500/5"
                  : "border-green-500/40 bg-green-500/5"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{scenario.label}</span>
                <div className="flex gap-2">
                  <Badge
                    variant={scenario.vestedEquityKept === 100 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    Vested: {scenario.vestedEquityKept}% kept
                  </Badge>
                  <Badge
                    variant={scenario.unvestedEquityKept > 0 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    Unvested: {scenario.unvestedEquityKept}% kept
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Repurchase: <span className="font-medium text-foreground">{scenario.repurchasePrice}</span>
                </span>
                <span className={scenario.nonCompeteApplies ? "text-destructive" : "text-muted-foreground"}>
                  Non-compete: {scenario.nonCompeteApplies ? "Applies" : "Waived"}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Vesting Milestones per Founder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Performance-Gated Vesting Schedule
          </CardTitle>
          <CardDescription>
            Equity unlocks tied to KPI achievement — not just time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {founders.map((f) => {
            const milestones = generateVestingMilestones(f);
            const eq = equitySplit.find((s) => s.founderId === f.id);
            return (
              <div key={f.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {eq ? (eq.equityPercent * 0.85).toFixed(1) : 0}% total (post-ESOP)
                  </span>
                </div>
                <div className="space-y-2">
                  {milestones.map((m) => (
                    <div key={m.quarter} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-muted-foreground shrink-0">
                        Q{m.quarter} ({m.quarter / 4}yr)
                      </div>
                      <Progress value={m.percentUnlocked} className="h-2 flex-1" />
                      <div className="w-12 text-xs font-mono text-right shrink-0">
                        {m.percentUnlocked}%
                      </div>
                      <div className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                        {m.requiredAchievements}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Protective Clauses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protective Clauses
          </CardTitle>
          <CardDescription>
            Standard legal protections for the company and all founders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROTECTIVE_CLAUSES.map((clause) => (
            <div
              key={clause.id}
              className="p-3 rounded-lg border bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clause.importance === "critical" ? (
                    <Lock className="h-4 w-4 text-destructive" />
                  ) : clause.importance === "important" ? (
                    <Shield className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{clause.title}</span>
                </div>
                <Badge
                  variant={
                    clause.importance === "critical"
                      ? "destructive"
                      : clause.importance === "important"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {clause.importance}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{clause.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  <span className="font-medium">{clause.duration}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground italic">{clause.standard}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Decision Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Decision Rights & Governance
          </CardTitle>
          <CardDescription>
            Who can approve what — prevents deadlocks and unauthorized actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground uppercase tracking-wider py-2">
              <span>Decision Type</span>
              <span>Description</span>
              <span>Who Approves</span>
              <span>Threshold</span>
            </div>
            <Separator />
            {DECISION_RIGHTS.map((dr, i) => (
              <div
                key={i}
                className="grid grid-cols-4 text-xs py-3 border-b border-border/50 items-start"
              >
                <span className="font-medium text-sm">{dr.category}</span>
                <span className="text-muted-foreground">{dr.description}</span>
                <span>{dr.approvalRequired}</span>
                <Badge variant="outline" className="text-xs w-fit">
                  {dr.threshold}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Conflict Resolution Escalation
          </CardTitle>
          <CardDescription>
            How disputes are resolved — from conversation to legally binding arbitration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CONFLICT_RESOLUTION.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 rounded-lg border"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {step.step}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.method}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.timeframe}
                    </Badge>
                    {step.binding && (
                      <Badge variant="destructive" className="text-xs">
                        Legally Binding
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {i < CONFLICT_RESOLUTION.length - 1 && (
                  <ArrowDown className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compensation Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Founder Compensation Guidelines
          </CardTitle>
          <CardDescription>
            Industry-standard founder salaries by stage — set expectations early
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {COMPENSATION_FRAMEWORK.map((tier, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border bg-muted/30 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tier.stage}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">CEO: </span>
                    <span className="font-mono font-medium">{tier.ceoSalary}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Other Founders: </span>
                    <span className="font-mono font-medium">{tier.otherFounderSalary}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">{tier.notes}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
            <p className="font-medium text-foreground mb-1">Important:</p>
            <p className="text-muted-foreground">
              Founder salaries should be equal (or very close) regardless of equity split.
              Salary compensates time; equity compensates value creation. Large salary
              differences between co-founders create resentment and signal dysfunction to investors.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Legal Documents
          </CardTitle>
          <CardDescription>
            Documents that must be executed before the company can raise money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { doc: "Certificate of Incorporation (Delaware C-Corp)", priority: "Day 1", critical: true },
              { doc: "Bylaws", priority: "Day 1", critical: true },
              { doc: "Founders Agreement (this tool's output)", priority: "Day 1", critical: true },
              { doc: "Restricted Stock Purchase Agreement (RSPA)", priority: "Day 1", critical: true },
              { doc: "83(b) Election (file with IRS)", priority: "Within 30 days of stock issuance", critical: true },
              { doc: "Proprietary Information & Inventions Assignment (PIIA)", priority: "Before any work", critical: true },
              { doc: "Board Consent for Stock Issuance", priority: "Day 1", critical: true },
              { doc: "Stock Option Plan (for ESOP)", priority: "Before first hire", critical: true },
              { doc: "Vesting Schedule Agreement", priority: "Day 1", critical: true },
              { doc: "Operating Agreement / Stockholders Agreement", priority: "Week 1", critical: false },
              { doc: "Board Observer Rights Agreement (if applicable)", priority: "Before fundraise", critical: false },
              { doc: "Indemnification Agreements", priority: "Before fundraise", critical: false },
              { doc: "D&O Insurance Policy", priority: "Before Series A", critical: false },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {item.critical ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">{item.doc}</span>
                </div>
                <Badge variant={item.critical ? "destructive" : "outline"} className="text-xs shrink-0">
                  {item.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
