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
  kpiToEnterpriseValue,
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

  const pieData = equitySplit.map((s, i) => ({
    name: s.founderName,
    value: Number(s.equityPercent.toFixed(2)),
    color: COLORS[i % COLORS.length],
  }));

  const barData = founders.map((f) => ({
    name: f.name,
    score: Number(founderEnterpriseValue(f).toFixed(1)),
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
          Calculated from KPI enterprise value contributions using a weighted
          multi-factor algorithm.
        </p>
      </div>

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
              Total KPIs Defined
            </div>
            <p className="text-2xl font-bold font-mono">
              {founders.reduce((sum, f) => sum + f.kpis.length, 0)}
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
              Percentage ownership based on KPI enterprise value
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
            <CardTitle>Enterprise Value Score</CardTitle>
            <CardDescription>
              Raw contribution score per founder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(220, 70%, 55%)" radius={4} />
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
                  <span className="text-sm text-muted-foreground font-mono">
                    Score: {split.rawScore.toFixed(1)}
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
            How the equity allocation is calculated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Each KPI is converted to an enterprise value score using the
            following formula:
          </p>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs">
            <p>score = weight × categoryMultiplier × difficultyMultiplier × timeDecay × scaleNorm</p>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Weight (0–100):</strong> Founder-defined importance of
              this KPI
            </li>
            <li>
              <strong>Category Multiplier:</strong> Revenue (1.5×), Fundraising
              (1.4×), Product (1.3×), Technical (1.2×), Leadership (1.15×),
              Marketing (1.1×), Operations (1.0×), Culture (0.9×)
            </li>
            <li>
              <strong>Difficulty Multiplier:</strong> Low (0.6×), Medium (1.0×),
              High (1.5×), Extreme (2.2×)
            </li>
            <li>
              <strong>Time Decay:</strong> 0.85^(months/12) — longer timeframes
              reduce annualized value
            </li>
            <li>
              <strong>Scale Norm:</strong> log₁₀(targetValue + 1) — prevents
              large numbers from dominating
            </li>
          </ul>
          <p>
            A founder&apos;s total equity percentage = their total score ÷ sum
            of all founders&apos; scores × 100.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
