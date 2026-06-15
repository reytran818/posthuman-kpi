"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Founder } from "@/lib/kpi-engine";
import {
  calculateEquitySplit,
  fairnessAnalysis,
  founderEnterpriseValue,
  founderKPIScore,
  founderContributionValue,
  validateKPIs,
  failureScenarios,
  assignRoles,
  investorReadinessCheck,
  detectOverlaps,
  EMPLOYEE_OPTION_POOL,
  skillsMultiplier,
} from "@/lib/kpi-engine";
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Target,
  DollarSign,
  Clock,
  Loader2,
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  Zap,
} from "lucide-react";

interface RecommendationsProps {
  founders: Founder[];
}

interface AIRecommendation {
  summary: string;
  founderSpecific: { name: string; items: string[] }[];
  companyWide: string[];
  nextSteps: string[];
}

export function Recommendations({ founders }: RecommendationsProps) {
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const equitySplit = calculateEquitySplit(founders);
  const analysis = fairnessAnalysis(founders);
  const kpiIssues = validateKPIs(founders);
  const scenarios = failureScenarios(founders);
  const roleAssignments = assignRoles(founders);
  const investorCheck = investorReadinessCheck(founders);
  const overlaps = detectOverlaps(founders);

  const founderRecs = founders.map((f) => {
    const recs: { priority: "high" | "medium" | "low"; text: string }[] = [];
    const split = equitySplit.find((s) => s.founderId === f.id);
    const hours = f.hoursPerWeek || 0;
    const hoursAdj = Math.sqrt(Math.min(hours || 40, 40) / 40);
    const kpiScore = founderKPIScore(f);
    const contribScore = founderContributionValue(f);
    const skills = f.relevantSkills || [];
    const skillsMult = skillsMultiplier(f);

    if (f.kpis.length < 3) {
      recs.push({
        priority: "medium",
        text: `Only ${f.kpis.length} KPI(s) assigned. Add more dimensions to prove breadth of contribution.`,
      });
    }

    const techKpis = f.kpis.filter((k) => k.category === "technical").length;

    if (skills.length < 5) {
      recs.push({
        priority: "low",
        text: `Only ${skills.length} skills listed. Adding relevant skills (especially mission-aligned: AI, health, devices) increases multiplier.`,
      });
    }

    if (!f.resume || f.resume.length < 50) {
      recs.push({
        priority: "medium",
        text: `Resume/background is sparse. A detailed resume improves AI analysis accuracy and investor confidence.`,
      });
    }

    if (split && f.requestedEquity) {
      const gap = f.requestedEquity - split.equityPercent;
      if (gap > 3) {
        recs.push({
          priority: gap > 7 ? "high" : "medium",
          text: `Requesting ${f.requestedEquity}% but algorithm calculates ${split.equityPercent.toFixed(1)}%. Gap of ${gap.toFixed(1)}% needs justification or KPI additions.`,
        });
      }
    }

    const extremeKpis = f.kpis.filter((k) => k.difficulty === "extreme");
    if (extremeKpis.length > 2 && hours < 30) {
      recs.push({
        priority: "high",
        text: `${extremeKpis.length} extreme-difficulty KPIs at ${hours}h/wk is unrealistic. Either increase hours or reduce difficulty to maintain credibility.`,
      });
    }

    if (contribScore === 0 && f.kpis.length > 0) {
      recs.push({
        priority: "medium",
        text: `No prior contributions recorded. Documenting past work (even small) adds 30% weight to your score.`,
      });
    }

    return { founder: f, recs, split };
  });

  const companyRecs: { priority: "high" | "medium" | "low"; text: string }[] = [];

  if (!founders.some((f) => (f.hoursPerWeek || 0) >= 35)) {
    companyRecs.push({
      priority: "high",
      text: "No full-time founder detected. Investors (especially YC) strongly prefer at least one full-time co-founder.",
    });
  }

  const totalRequested = founders.reduce((s, f) => s + (f.requestedEquity || 0), 0);
  const founderPool = 100 - EMPLOYEE_OPTION_POOL;
  if (totalRequested > founderPool) {
    companyRecs.push({
      priority: "high",
      text: `Total requested equity (${totalRequested}%) exceeds founder pool (${founderPool}%). Negotiate reductions before signing.`,
    });
  }

  if (overlaps.filter((o) => o.severity === "conflict").length > 0) {
    companyRecs.push({
      priority: "high",
      text: "Role conflicts detected. Multiple founders claiming the same domains will cause friction. Assign clear ownership.",
    });
  }

  const hasRevenue = founders.some((f) =>
    f.kpis.some((k) => k.category === "revenue" || k.category === "fundraising")
  );
  if (!hasRevenue) {
    companyRecs.push({
      priority: "high",
      text: "No founder has revenue or fundraising KPIs. Without someone directly responsible for money, the company will run out of runway.",
    });
  }

  if (investorCheck.score < 70) {
    companyRecs.push({
      priority: "medium",
      text: `Investor readiness score is ${investorCheck.score}/100. Address the flagged items before approaching VCs.`,
    });
  }

  if (kpiIssues.length > 3) {
    companyRecs.push({
      priority: "medium",
      text: `${kpiIssues.length} KPI quality issues detected. Fix vague/invalid KPIs to maintain agreement credibility.`,
    });
  }

  const maxRatio =
    Math.max(...equitySplit.map((s) => s.equityPercent)) /
    Math.max(Math.min(...equitySplit.map((s) => s.equityPercent)), 0.1);
  if (maxRatio > 5) {
    companyRecs.push({
      priority: "medium",
      text: `Equity ratio is ${maxRatio.toFixed(1)}:1. Highly skewed distributions breed resentment. Consider rebalancing.`,
    });
  }

  async function fetchAIRecommendation() {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founders,
          analysisType: "recommendations",
        }),
      });
      if (!response.ok) throw new Error("AI analysis failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }

      const parsed = parseAIResponse(text);
      setAiRec(parsed);
    } catch {
      setAiRec({
        summary: "Unable to generate AI recommendations. Using algorithmic analysis only.",
        founderSpecific: [],
        companyWide: ["Retry AI analysis when connection is available."],
        nextSteps: ["Review the algorithmic recommendations below."],
      });
    } finally {
      setLoading(false);
    }
  }

  function parseAIResponse(text: string): AIRecommendation {
    const lines = text.split("\n").filter((l) => l.trim());
    const result: AIRecommendation = {
      summary: "",
      founderSpecific: [],
      companyWide: [],
      nextSteps: [],
    };

    let section = "summary";
    let currentFounder: { name: string; items: string[] } | null = null;

    for (const line of lines) {
      if (line.includes("FOUNDER-SPECIFIC") || line.includes("Per-Founder")) {
        section = "founder";
        continue;
      }
      if (line.includes("COMPANY-WIDE") || line.includes("Company")) {
        if (currentFounder) result.founderSpecific.push(currentFounder);
        currentFounder = null;
        section = "company";
        continue;
      }
      if (line.includes("NEXT STEPS") || line.includes("Action Items")) {
        section = "next";
        continue;
      }

      if (section === "summary" && line.length > 10 && !line.startsWith("#")) {
        result.summary += (result.summary ? " " : "") + line.trim();
      } else if (section === "founder") {
        const founderMatch = line.match(/^(?:#{1,3}\s+)?(?:\*\*)?([A-Z][a-z]+ [A-Z][a-z]+)/);
        if (founderMatch) {
          if (currentFounder) result.founderSpecific.push(currentFounder);
          currentFounder = { name: founderMatch[1], items: [] };
        } else if (currentFounder && (line.startsWith("-") || line.startsWith("•") || line.startsWith("*"))) {
          currentFounder.items.push(line.replace(/^[-•*]\s*/, "").trim());
        }
      } else if (section === "company" && (line.startsWith("-") || line.startsWith("•") || line.startsWith("*"))) {
        result.companyWide.push(line.replace(/^[-•*]\s*/, "").trim());
      } else if (section === "next" && (line.startsWith("-") || line.startsWith("•") || line.startsWith("*") || /^\d/.test(line))) {
        result.nextSteps.push(line.replace(/^[-•*\d.)\s]+/, "").trim());
      }
    }

    if (currentFounder) result.founderSpecific.push(currentFounder);

    if (!result.summary) result.summary = text.slice(0, 200);
    return result;
  }

  function priorityColor(p: "high" | "medium" | "low") {
    switch (p) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  }

  function priorityIcon(p: "high" | "medium" | "low") {
    switch (p) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case "medium":
        return <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0" />;
      case "low":
        return <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recommendations</h2>
          <p className="text-muted-foreground">
            Actionable guidance for each founder and the company overall
          </p>
        </div>
        <Button onClick={fetchAIRecommendation} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "AI Deep Analysis"}
        </Button>
      </div>

      {aiRec && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Sparkles className="h-5 w-5" />
              AI Recommendation
            </CardTitle>
            <CardDescription className="text-purple-700">
              {aiRec.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiRec.founderSpecific.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-800">Per Founder:</h4>
                {aiRec.founderSpecific.map((fr, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-sm font-medium text-purple-700">{fr.name}</p>
                    <ul className="text-sm text-purple-900/80 ml-4 list-disc space-y-0.5">
                      {fr.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {aiRec.companyWide.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-800">Company-Wide:</h4>
                <ul className="text-sm text-purple-900/80 ml-4 list-disc space-y-0.5">
                  {aiRec.companyWide.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiRec.nextSteps.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-800">Next Steps:</h4>
                <ol className="text-sm text-purple-900/80 ml-4 list-decimal space-y-0.5">
                  {aiRec.nextSteps.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{investorCheck.score}/100</p>
                <p className="text-xs text-muted-foreground">Investor Readiness</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {companyRecs.filter((r) => r.priority === "high").length +
                    founderRecs.reduce(
                      (s, fr) => s + fr.recs.filter((r) => r.priority === "high").length,
                      0
                    )}
                </p>
                <p className="text-xs text-muted-foreground">High Priority Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiIssues.length}</p>
                <p className="text-xs text-muted-foreground">KPI Issues to Fix</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {companyRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Company-Wide Recommendations
            </CardTitle>
            <CardDescription>
              Issues affecting the entire founding team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {companyRecs
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.priority] - order[b.priority];
              })
              .map((rec, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${priorityColor(rec.priority)}`}
                >
                  {priorityIcon(rec.priority)}
                  <div className="flex-1">
                    <p className="text-sm">{rec.text}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${rec.priority === "high" ? "border-red-300" : rec.priority === "medium" ? "border-yellow-300" : "border-blue-300"}`}
                  >
                    {rec.priority}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      <h3 className="text-lg font-semibold flex items-center gap-2">
        <UserCheck className="h-5 w-5" />
        Per-Founder Recommendations
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {founderRecs.map(({ founder, recs, split }) => (
          <Card key={founder.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{founder.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {split && (
                    <Badge variant="secondary" className="font-mono">
                      Calc: {split.equityPercent.toFixed(1)}%
                    </Badge>
                  )}
                  {founder.requestedEquity && (
                    <Badge variant="outline" className="font-mono">
                      Req: {founder.requestedEquity}%
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {founder.hoursPerWeek || 0}h/wk
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {roleAssignments.find((r) => r.founderId === founder.id)?.recommendedRole || founder.role}
                {founder.yearsExperience != null && ` • ${founder.yearsExperience}yr exp`}
                {` • ${(founder.relevantSkills || []).length} skills`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recs.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  No major issues. Position looks reasonable.
                </div>
              ) : (
                <div className="space-y-2">
                  {recs
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.priority] - order[b.priority];
                    })
                    .map((rec, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border ${priorityColor(rec.priority)}`}
                      >
                        {priorityIcon(rec.priority)}
                        <p className="text-sm flex-1">{rec.text}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Wins
          </CardTitle>
          <CardDescription>
            Easy actions that immediately improve the agreement quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {founders
              .filter((f) => (f.relevantSkills || []).length < 5)
              .slice(0, 3)
              .map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span>Add relevant skills for <strong>{f.name}</strong></span>
                </div>
              ))}
            {founders
              .filter((f) => !f.resume || f.resume.length < 50)
              .slice(0, 3)
              .map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span>Fill in resume for <strong>{f.name}</strong></span>
                </div>
              ))}
            {founders
              .filter((f) => f.kpis.length < 3 && f.kpis.length > 0)
              .slice(0, 3)
              .map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span>Add more KPIs for <strong>{f.name}</strong> (currently {f.kpis.length})</span>
                </div>
              ))}
            {kpiIssues.length > 0 && (
              <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span>Fix <strong>{kpiIssues.length}</strong> vague/invalid KPIs</span>
              </div>
            )}
            {!hasRevenue && (
              <div className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span>Assign <strong>revenue KPIs</strong> to at least one founder</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Negotiation Guidance
          </CardTitle>
          <CardDescription>
            Data-driven talking points for equity discussions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {equitySplit.map((s) => {
              const f = founders.find((x) => x.id === s.founderId);
              if (!f || !f.requestedEquity) return null;
              const gap = f.requestedEquity - s.equityPercent;
              if (Math.abs(gap) < 2) return null;

              return (
                <div key={s.founderId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{f.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {gap > 0 ? "Over-asking" : "Under-asking"} by {Math.abs(gap).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {gap > 5 ? (
                      <>
                        To justify {f.requestedEquity}%: increase hours (currently{" "}
                        {f.hoursPerWeek || 0}h/wk), add higher-impact KPIs, or reduce
                        request to ~{s.equityPercent.toFixed(0)}%.
                      </>
                    ) : gap > 0 ? (
                      <>
                        Small gap — could be closed with 1-2 additional high-value KPIs
                        or documenting past contributions.
                      </>
                    ) : gap < -5 ? (
                      <>
                        Algorithm values this role higher than requested. Consider
                        increasing request to {s.equityPercent.toFixed(0)}% or negotiate
                        upward based on performance.
                      </>
                    ) : (
                      <>
                        Slightly undervalued. Could request {s.equityPercent.toFixed(1)}%
                        with algorithmic backing.
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">How the algorithm works (neutral):</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>All KPI categories weighted <strong>equally</strong> (1.0×)</li>
              <li>Score = weight × difficulty × time decay × log(target)</li>
              <li>70% future KPIs + 30% documented past contributions</li>
              <li>No hours penalty, no experience boost, no category bias</li>
              <li>Equity = your score ÷ total team score × 90% founder pool</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
