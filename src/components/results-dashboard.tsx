"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Founder } from "@/lib/kpi-engine";
import {
  calculateEquitySplit,
  projectedEnterpriseValue,
  fairnessAnalysis,
  founderEnterpriseValue,
  founderKPIScore,
  founderContributionValue,
  kpiToEnterpriseValue,
  validateKPIs,
  failureScenarios,
} from "@/lib/kpi-engine";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Scale,
  AlertCircle,
  GitMerge,
  XCircle,
  ShieldAlert,
} from "lucide-react";

interface ResultsDashboardProps {
  founders: Founder[];
}

const COLORS = [
  "hsl(220, 70%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(160, 70%, 45%)",
  "hsl(45, 80%, 55%)",
  "hsl(280, 60%, 55%)",
];

export function ResultsDashboard({ founders }: ResultsDashboardProps) {
  const equitySplit = calculateEquitySplit(founders);
  const enterpriseValue = projectedEnterpriseValue(founders);
  const analysis = fairnessAnalysis(founders);
  const kpiIssues = validateKPIs(founders);
  const scenarios = failureScenarios(founders);

  const pieData = equitySplit.map((s, i) => ({
    name: s.founderName,
    value: Number(s.equityPercent.toFixed(2)),
    color: COLORS[i % COLORS.length],
  }));

  const stackedBarData = founders.map((f) => ({
    name: f.name,
    "Future KPIs (70%)": Number((founderKPIScore(f) * 0.7).toFixed(1)),
    "Prior Contributions (30%)": Number(
      (founderContributionValue(f) * 0.3).toFixed(1)
    ),
  }));

  const kpiBreakdown = founders.flatMap((f) =>
    f.kpis.map((kpi) => ({
      founder: f.name,
      kpi: kpi.name,
      category: kpi.category,
      score: Number(kpiToEnterpriseValue(kpi).toFixed(1)),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Equity Allocation Results
        </h2>
        <p className="text-muted-foreground mt-1">
          Calculated from KPI commitments (70%) and prior contributions (30%).
          Execution is weighted 6.7× higher than ideas.
        </p>
      </div>

      {/* Overlap warnings at top */}
      {analysis.overlaps.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitMerge className="h-5 w-5 text-yellow-500" />
              Overlap Detection
            </CardTitle>
            <CardDescription>
              Areas where multiple founders have overlapping claims or
              responsibilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.overlaps.map((overlap, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  overlap.severity === "conflict"
                    ? "bg-destructive/10 border border-destructive/30"
                    : overlap.severity === "warning"
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : "bg-muted"
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    overlap.severity === "conflict"
                      ? "text-destructive"
                      : overlap.severity === "warning"
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        overlap.severity === "conflict"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {overlap.area}
                    </Badge>
                    {overlap.founderNames.map((name) => (
                      <Badge key={name} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {overlap.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Projected Enterprise Value
            </div>
            <p className="text-2xl font-bold font-mono">
              ${(enterpriseValue / 1_000_000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Total KPIs + Contributions
            </div>
            <p className="text-2xl font-bold font-mono">
              {founders.reduce((sum, f) => sum + f.kpis.length, 0)} KPIs •{" "}
              {founders.reduce(
                (sum, f) => sum + (f.contributions || []).length,
                0
              )}{" "}
              contributions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Scale className="h-4 w-4" />
              Fairness Status
            </div>
            <div className="flex items-center gap-2">
              {analysis.isBalanced ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Balanced</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-500">
                    Review Needed
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Equity Split</CardTitle>
            <CardDescription>
              Percentage ownership based on total value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value Breakdown</CardTitle>
            <CardDescription>
              Future KPIs (70%) vs Prior Contributions (30%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stackedBarData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Future KPIs (70%)"
                  stackId="a"
                  fill="hsl(220, 70%, 55%)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Prior Contributions (30%)"
                  stackId="a"
                  fill="hsl(160, 70%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Equity Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {equitySplit.map((split, i) => (
            <div key={split.founderId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-medium">{split.founderName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground font-mono">
                    KPI: {split.kpiScore.toFixed(1)} | Contrib:{" "}
                    {split.contributionScore.toFixed(1)}
                  </span>
                  <Badge variant="default" className="font-mono">
                    {split.equityPercent.toFixed(2)}%
                  </Badge>
                </div>
              </div>
              <Progress value={split.equityPercent} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Requested vs Calculated Equity */}
      {founders.some((f) => f.requestedEquity && f.requestedEquity > 0) && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Requested vs Calculated Equity
            </CardTitle>
            <CardDescription>
              Comparing what each founder asks for vs what the algorithm says
              they deserve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
                <span>Founder</span>
                <span className="text-center">Requested</span>
                <span className="text-center">Calculated</span>
                <span className="text-center">Difference</span>
                <span className="text-center">Verdict</span>
              </div>
              <Separator />
              {founders.map((f) => {
                const calc = equitySplit.find((s) => s.founderId === f.id);
                const requested = f.requestedEquity || 0;
                const calculated = calc?.equityPercent || 0;
                const diff = requested - calculated;
                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-5 items-center text-sm py-2 border-b border-border/50"
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-center font-mono">
                      {requested > 0 ? `${requested}%` : "—"}
                    </span>
                    <span className="text-center font-mono">
                      {calculated.toFixed(1)}%
                    </span>
                    <span
                      className={`text-center font-mono ${
                        diff > 5
                          ? "text-destructive"
                          : diff < -5
                          ? "text-blue-500"
                          : "text-green-500"
                      }`}
                    >
                      {requested > 0
                        ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}pp`
                        : "—"}
                    </span>
                    <span className="text-center">
                      {requested === 0 ? (
                        <Badge variant="outline">No request</Badge>
                      ) : Math.abs(diff) <= 5 ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          Fair
                        </Badge>
                      ) : diff > 5 ? (
                        <Badge variant="destructive">Over-asking</Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                          Under-asking
                        </Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Validation Issues */}
      {kpiIssues.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              KPI Validation Issues
            </CardTitle>
            <CardDescription>
              KPIs must be hard numbers and results-driven — not vague
              percentages or conditional promises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpiIssues.map((issue, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  issue.severity === "error"
                    ? "bg-destructive/10 border border-destructive/30"
                    : "bg-yellow-500/10 border border-yellow-500/30"
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    issue.severity === "error"
                      ? "text-destructive"
                      : "text-yellow-500"
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {issue.founderName}
                    </Badge>
                    <span className="text-sm font-medium">{issue.kpiName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.issue}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Failure Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            What If a Founder Fails to Deliver?
          </CardTitle>
          <CardDescription>
            How equity should adjust if a founder delivers 0% or 50% of their
            KPI commitments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
              <span>Founder</span>
              <span>Scenario</span>
              <span className="text-center">Adjusted Equity</span>
              <span className="text-center">Change</span>
            </div>
            <Separator />
            {scenarios.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-4 items-center text-sm py-2 border-b border-border/50"
              >
                <span className="font-medium">{s.founderName}</span>
                <span className="text-muted-foreground">
                  {s.scenarioLabel}
                </span>
                <span className="text-center font-mono">
                  {s.adjustedEquity.toFixed(1)}%
                </span>
                <span
                  className={`text-center font-mono ${
                    s.equityChange < -5
                      ? "text-destructive"
                      : s.equityChange < 0
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.equityChange.toFixed(1)}pp
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              Recommended: Include a vesting/clawback clause
            </p>
            <p>
              If a founder fails to deliver on KPIs, their equity should vest
              over time tied to performance milestones. Consider a 4-year vest
              with 1-year cliff, where KPI achievement unlocks each tranche.
              Total failure = equity returns to the company pool.
            </p>
          </div>
        </CardContent>
      </Card>

      {kpiBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>KPI Value Breakdown</CardTitle>
            <CardDescription>
              Individual KPI scores that drive the allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2">
                <span>Founder</span>
                <span>KPI</span>
                <span>Category</span>
                <span className="text-right">Score</span>
              </div>
              <Separator />
              {kpiBreakdown
                .sort((a, b) => b.score - a.score)
                .map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 text-sm py-2 border-b border-border/50"
                  >
                    <span className="text-muted-foreground">{row.founder}</span>
                    <span>{row.kpi}</span>
                    <Badge variant="outline" className="w-fit">
                      {row.category}
                    </Badge>
                    <span className="text-right font-mono">{row.score}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(analysis.warnings.length > 0 ||
        analysis.recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Fairness Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.warnings.map((warning, i) => (
              <Alert key={`w-${i}`} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
            {analysis.recommendations.map((rec, i) => (
              <Alert key={`r-${i}`}>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Recommendation</AlertTitle>
                <AlertDescription>{rec}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Transparency</CardTitle>
          <CardDescription>
            How equity is calculated — execution over ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="font-medium text-foreground">
                Future KPIs (70% of equity)
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs">
                score = weight × categoryMult × difficultyMult × timeDecay ×
                log₁₀(target)
              </div>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Category: Revenue 1.5× → Culture 0.9×</li>
                <li>Difficulty: Low 0.6× → Extreme 2.2×</li>
                <li>Time Decay: 0.85^(months/12)</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="font-medium text-foreground">
                Prior Contributions (30% of equity)
              </p>
              <div className="bg-muted rounded-lg p-3 font-mono text-xs">
                score = typeWeight × log₂(hours) × log₁₀(value) × 10
              </div>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Execution / Building: 1.0× (100%)</li>
                <li>Technical Build: 0.95×</li>
                <li>Revenue Generated: 0.9×</li>
                <li>Capital Invested: 0.85×</li>
                <li>IP Created: 0.8×</li>
                <li>Domain Expertise: 0.7×</li>
                <li>Team Recruited: 0.65×</li>
                <li>Network: 0.5×</li>
                <li>Market Research: 0.4×</li>
                <li>
                  <strong>Idea / Vision: 0.15× (15%)</strong>
                </li>
              </ul>
            </div>
          </div>
          <Separator />
          <p>
            <strong>Equity %</strong> = founder total score ÷ all founders total
            × 100. The 70/30 split ensures that future commitments to execute
            outweigh past contributions, while still rewarding those who have
            already invested time, money, and effort.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
