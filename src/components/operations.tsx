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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import type { Founder } from "@/lib/kpi-engine";
import {
  calculateEquitySplit,
  founderKPIScore,
  founderContributionValue,
} from "@/lib/kpi-engine";
import {
  FileDown,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  Sliders,
  History,
  Users,
  XCircle,
} from "lucide-react";

interface OperationsProps {
  founders: Founder[];
  setFounders: (f: Founder[]) => void;
}

export function Operations({ founders, setFounders }: OperationsProps) {
  const [simWeights, setSimWeights] = useState({ future: 70, prior: 30 });
  const [monthlyBurn, setMonthlyBurn] = useState(5000);
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const equitySplit = calculateEquitySplit(founders);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Operations & Tools
        </h2>
        <p className="text-muted-foreground mt-1">
          Export, review, simulate, and track your founders agreement.
        </p>
      </div>

      {/* Export to PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Founders Agreement
          </CardTitle>
          <CardDescription>
            Generate a printable summary to take to your lawyer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.print()}
            className="mr-3"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const data = JSON.stringify(founders, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `posthuman-founders-agreement-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export Raw Data (JSON)
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Use Print/PDF to generate a formatted document. The JSON export contains all structured data for backup or legal review.
          </p>
        </CardContent>
      </Card>

      {/* Founder Sign-off */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Founder Sign-off
          </CardTitle>
          <CardDescription>
            Each founder formally accepts or disputes the current terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {founders.map((f) => {
            const eq = equitySplit.find((s) => s.founderId === f.id);
            const signedOff = (f as Record<string, unknown>).signedOff as string | undefined;
            return (
              <div
                key={f.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  signedOff ? "border-green-500/40 bg-green-500/5" : "border-border"
                }`}
              >
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {f.role} • {eq?.equityPercent.toFixed(1)}% equity (calculated)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {signedOff ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                      Accepted {new Date(signedOff).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          const updated = founders.map((fo) =>
                            fo.id === f.id
                              ? { ...fo, signedOff: new Date().toISOString() }
                              : fo
                          );
                          setFounders(updated as Founder[]);
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Accept Terms
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt(`${f.name}: What do you dispute? (This will be logged)`);
                          if (reason) {
                            const updated = founders.map((fo) =>
                              fo.id === f.id
                                ? { ...fo, dispute: reason, disputeDate: new Date().toISOString() }
                                : fo
                            );
                            setFounders(updated as Founder[]);
                          }
                        }}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Dispute
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Sign-off is timestamped and stored. All founders should accept before formalizing with legal counsel.
          </p>
        </CardContent>
      </Card>

      {/* Quarterly KPI Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            KPI Progress Review
          </CardTitle>
          <CardDescription>
            Track achievement against commitments — review cadence: informal weekly, formal monthly, quarterly roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {founders.map((f) => (
            <div key={f.id} className="space-y-2">
              <p className="font-medium">{f.name} — {f.role}</p>
              <div className="space-y-2">
                {f.kpis.map((kpi) => {
                  const progress = ((kpi as Record<string, unknown>).progress as number) || 0;
                  return (
                    <div key={kpi.id} className="flex items-center gap-3">
                      <div className="w-40 text-xs truncate" title={kpi.name}>
                        {kpi.name}
                      </div>
                      <Progress value={progress} className="flex-1 h-2" />
                      <div className="w-12 text-xs font-mono text-right">{progress}%</div>
                      <Slider
                        className="w-24"
                        value={[progress]}
                        max={100}
                        step={5}
                        onValueChange={([val]) => {
                          const updated = founders.map((fo) =>
                            fo.id === f.id
                              ? {
                                  ...fo,
                                  kpis: fo.kpis.map((k) =>
                                    k.id === kpi.id ? { ...k, progress: val } : k
                                  ),
                                }
                              : fo
                          );
                          setFounders(updated as Founder[]);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Phased Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Phased Timeline
          </CardTitle>
          <CardDescription>
            Key milestones across Q3 2026 → Q2 2027
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { phase: "Now (Parallel)", window: "Q3 2026", items: ["GTM + pricing, deck + data room, site, brand spec", "App: submission, score, integrations, launch gate", "Ops cadence, AI ops stack v1, internal funding sales live"] },
              { phase: "Launch", window: "Q3 2026", items: ["First paying cohort, content + distribution hires", "App reliability + SAB; earbud prototype iterations", "Automation depth, internal tools, sales system + marketing"] },
              { phase: "Scale", window: "Q4 2026 – Q1 2027", items: ["Partnerships signed, app design system, investor talks", "Earbud manufacturing readiness; proprietary sensor R&D", "Repeatable micro-SaaS, tooling for growth, ops scaling"] },
              { phase: "Stage 2", window: "Q1 – Q2 2027", items: ["Capital, partnerships, manufacturing contracting", "Earbud DVT/PVT toward tooling per timeline", ""] },
            ].map((p, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-32 shrink-0">
                  <Badge variant="default" className="text-xs">{p.phase}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{p.window}</p>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  {p.items.map((item, j) => (
                    item && (
                      <div key={j} className="p-2 bg-muted rounded text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {["Shawn", "Aryan", "Ian"][j]}:
                        </span>{" "}
                        {item}
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Runway Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Runway Calculator
          </CardTitle>
          <CardDescription>
            How long can the company operate with current funding?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly Burn Rate ($)</Label>
              <Input
                type="number"
                value={monthlyBurn}
                onChange={(e) => setMonthlyBurn(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Income / Contributions ($)</Label>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Net Monthly Burn</p>
              <p className="text-lg font-bold font-mono">
                ${(monthlyBurn - monthlyIncome).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Annual Burn</p>
              <p className="text-lg font-bold font-mono">
                ${((monthlyBurn - monthlyIncome) * 12).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${
              monthlyIncome >= monthlyBurn ? "bg-green-500/10" : "bg-destructive/10"
            }`}>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-bold">
                {monthlyIncome >= monthlyBurn ? "Sustainable" : "Burning"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pre-seed: focus on minimizing burn while hitting KPI milestones. Target $0 net burn through founder contributions until external funding closes.
          </p>
        </CardContent>
      </Card>

      {/* Equity Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Equity Simulator — What If?
          </CardTitle>
          <CardDescription>
            Adjust the future/prior weight split and see how equity changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Future KPIs: {simWeights.future}%</span>
              <span>Prior Contributions: {simWeights.prior}%</span>
            </div>
            <Slider
              value={[simWeights.future]}
              min={20}
              max={90}
              step={5}
              onValueChange={([val]) => setSimWeights({ future: val, prior: 100 - val })}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            {founders.map((f) => {
              const kpiScore = founderKPIScore(f);
              const contribScore = founderContributionValue(f);
              const simTotal = kpiScore * (simWeights.future / 100) + contribScore * (simWeights.prior / 100);
              const allTotals = founders.map((fo) => {
                const k = founderKPIScore(fo);
                const c = founderContributionValue(fo);
                return k * (simWeights.future / 100) + c * (simWeights.prior / 100);
              });
              const sumAll = allTotals.reduce((a, b) => a + b, 0);
              const simPercent = sumAll > 0 ? (simTotal / sumAll) * 85 : 0;
              const actualPercent = (equitySplit.find((s) => s.founderId === f.id)?.equityPercent || 0) * 0.85;
              const diff = simPercent - actualPercent;

              return (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">{simPercent.toFixed(1)}%</span>
                    <span className={`text-xs font-mono ${
                      diff > 1 ? "text-green-500" : diff < -1 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      ({diff > 0 ? "+" : ""}{diff.toFixed(1)}pp vs current)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Default is 70/30 (future/prior). Adjust to see how different weightings affect the split. All founders must agree to change.
          </p>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>
            Record of significant events and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { date: new Date().toLocaleDateString(), action: "Founder data seeded from KPI documents", by: "System" },
              { date: new Date().toLocaleDateString(), action: "Agreement tool created with algorithm, legal framework, and investor readiness checks", by: "System" },
            ].map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">{entry.date}</span>
                <span className="flex-1">{entry.action}</span>
                <Badge variant="outline" className="text-xs">{entry.by}</Badge>
              </div>
            ))}
            {founders.map((f) => {
              const signedOff = (f as Record<string, unknown>).signedOff as string | undefined;
              const dispute = (f as Record<string, unknown>).dispute as string | undefined;
              const disputeDate = (f as Record<string, unknown>).disputeDate as string | undefined;
              return [
                signedOff && (
                  <div key={`sign-${f.id}`} className="flex items-center gap-3 py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
                      {new Date(signedOff).toLocaleDateString()}
                    </span>
                    <span className="flex-1">Accepted terms</span>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">{f.name}</Badge>
                  </div>
                ),
                dispute && (
                  <div key={`disp-${f.id}`} className="flex items-center gap-3 py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
                      {disputeDate ? new Date(disputeDate).toLocaleDateString() : "—"}
                    </span>
                    <span className="flex-1">Disputed: &ldquo;{dispute}&rdquo;</span>
                    <Badge variant="destructive" className="text-xs">{f.name}</Badge>
                  </div>
                ),
              ];
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advisor Agreement Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Advisor & SAB Agreement Template
          </CardTitle>
          <CardDescription>
            Standard terms for Scientific Advisory Board members and business advisors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <p className="font-medium text-foreground">Standard Advisor Terms:</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-medium">Equity:</p>
                <p className="text-muted-foreground">0.25% – 1.0% depending on involvement level</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Vesting:</p>
                <p className="text-muted-foreground">2-year vesting, no cliff (monthly)</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Time Commitment:</p>
                <p className="text-muted-foreground">2-5 hours/month (calls + email)</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Term:</p>
                <p className="text-muted-foreground">12-24 months with mutual termination</p>
              </div>
            </div>
            <Separator />
            <p className="font-medium text-foreground">Advisor Tiers:</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 border rounded">
                <span>Standard Advisor (intros, occasional advice)</span>
                <span className="font-mono">0.25%</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Strategic Advisor (regular meetings, domain expertise)</span>
                <span className="font-mono">0.50%</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>SAB Member (scientific credibility, research guidance)</span>
                <span className="font-mono">0.25 – 0.50%</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Lead Advisor / Board Observer (heavy involvement)</span>
                <span className="font-mono">0.75 – 1.0%</span>
              </div>
            </div>
            <Separator />
            <p className="font-medium text-foreground">Required Agreements:</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Advisor Agreement (equity, vesting, responsibilities)</li>
              <li>Confidentiality/NDA (same as founder-level)</li>
              <li>IP Assignment for any work product</li>
              <li>Non-compete NOT required (advisors may advise multiple companies)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
