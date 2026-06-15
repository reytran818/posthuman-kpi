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
import { Separator } from "@/components/ui/separator";
import type { Founder } from "@/lib/kpi-engine";
import {
  AlertTriangle,
  Award,
  Ban,
  Check,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  Shield,
  TrendingUp,
} from "lucide-react";

interface AccountabilityProps {
  founders: Founder[];
  setFounders: (f: Founder[]) => void;
}

const BONUS_POOL_TOTAL = 5; // 5% total bonus pool

export function Accountability({ founders, setFounders }: AccountabilityProps) {
  const [warningForm, setWarningForm] = useState({ founderId: "", reason: "" });
  const [bonusForm, setBonusForm] = useState({ founderId: "", description: "", amount: 0.5 });
  const [milestoneForm, setMilestoneForm] = useState({
    founderId: "",
    kpiName: "",
    targetValue: 0,
    unit: "",
    equityPercent: 0,
  });

  function updateFounder(id: string, updates: Partial<Founder>) {
    setFounders(
      founders.map((f) => (f.id === id ? { ...f, ...updates } : f)) as Founder[]
    );
  }

  function addWarning(founderId: string, reason: string) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const warning = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      reason,
    };
    updateFounder(founderId, {
      warnings: [...(founder.warnings || []), warning],
    } as Partial<Founder>);
    setWarningForm({ founderId: "", reason: "" });
  }

  function toggleVesting(founderId: string) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const paused = !founder.vestingPaused;
    updateFounder(founderId, {
      vestingPaused: paused,
      vestingPausedDate: paused ? new Date().toISOString() : "",
    } as Partial<Founder>);
  }

  function declareCause(founderId: string) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    if (!confirm(`Declare "cause" for ${founder.name}? This stops all vesting and flags them for removal. This requires board vote.`)) return;
    updateFounder(founderId, {
      causeTermination: true,
      vestingPaused: true,
      vestingPausedDate: new Date().toISOString(),
    } as Partial<Founder>);
  }

  function awardBonus(founderId: string, description: string, amount: number) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const milestone = {
      id: crypto.randomUUID(),
      description,
      equityAmount: amount,
      earnedDate: new Date().toISOString(),
    };
    updateFounder(founderId, {
      bonusMilestones: [...(founder.bonusMilestones || []), milestone],
      bonusEquityEarned: (founder.bonusEquityEarned || 0) + amount,
    } as Partial<Founder>);
    setBonusForm({ founderId: "", description: "", amount: 0.5 });
  }

  const totalBonusAwarded = founders.reduce(
    (sum, f) => sum + (f.bonusEquityEarned || 0),
    0
  );
  const bonusPoolRemaining = BONUS_POOL_TOTAL - totalBonusAwarded;

  function addMilestone(founderId: string, kpiName: string, targetValue: number, unit: string, equityPercent: number) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const milestone = {
      id: crypto.randomUUID(),
      kpiName,
      targetValue,
      unit,
      equityPercent,
      achieved: false,
    };
    updateFounder(founderId, {
      equityMilestones: [...(founder.equityMilestones || []), milestone],
    } as Partial<Founder>);
    setMilestoneForm({ founderId: "", kpiName: "", targetValue: 0, unit: "", equityPercent: 0 });
  }

  function achieveMilestone(founderId: string, milestoneId: string) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const milestones = (founder.equityMilestones || []).map((m) =>
      m.id === milestoneId ? { ...m, achieved: true, achievedDate: new Date().toISOString() } : m
    );
    const lockedTotal = milestones
      .filter((m) => m.achieved)
      .reduce((sum, m) => sum + m.equityPercent, 0);
    updateFounder(founderId, {
      equityMilestones: milestones,
      lockedEquity: lockedTotal,
    } as Partial<Founder>);
  }

  const totalLockedEquity = founders.reduce(
    (sum, f) => sum + (f.lockedEquity || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Accountability - Warnings & Cause */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Accountability — Failure to Deliver
          </CardTitle>
          <CardDescription>
            Same process for all founders including CEO. Miss → Warning → Grace (30 days) → Cause → Vesting Stops.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
            <p className="font-medium">How it works:</p>
            <p>1. Miss is documented at regular review</p>
            <p>2. Founder gets 30-day grace period to fix it</p>
            <p>3. If repeated, board declares &quot;cause&quot; — vesting stops, role removed</p>
            <p>4. Unearned (unvested) shares bought back at cost</p>
            <p>5. Already-vested shares are kept (cannot claw back earned equity)</p>
          </div>

          {founders.map((f) => {
            const warningCount = (f.warnings || []).length;
            const isPaused = f.vestingPaused;
            const isCause = f.causeTermination;

            return (
              <div
                key={f.id}
                className={`p-4 rounded-lg border ${
                  isCause
                    ? "border-destructive bg-destructive/5"
                    : isPaused
                    ? "border-yellow-500/50 bg-yellow-500/5"
                    : warningCount > 0
                    ? "border-orange-500/30"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCause && (
                      <Badge variant="destructive">CAUSE DECLARED</Badge>
                    )}
                    {isPaused && !isCause && (
                      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                        Vesting Paused
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                        {warningCount} warning{warningCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {warningCount === 0 && !isPaused && !isCause && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        Good Standing
                      </Badge>
                    )}
                  </div>
                </div>

                {(f.warnings || []).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {(f.warnings || []).map((w) => (
                      <div key={w.id} className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />
                        <span className="text-muted-foreground font-mono">
                          {new Date(w.date).toLocaleDateString()}
                        </span>
                        <span>{w.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const reason = prompt(`Warning for ${f.name} — what did they miss?`);
                      if (reason) addWarning(f.id, reason);
                    }}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issue Warning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleVesting(f.id)}
                  >
                    {isPaused ? (
                      <><PlayCircle className="h-3 w-3 mr-1" /> Resume Vesting</>
                    ) : (
                      <><PauseCircle className="h-3 w-3 mr-1" /> Pause Vesting</>
                    )}
                  </Button>
                  {!isCause && warningCount >= 2 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => declareCause(f.id)}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Declare Cause
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bonus Equity Pool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Bonus Equity Pool
          </CardTitle>
          <CardDescription>
            {BONUS_POOL_TOTAL}% total set aside for above-and-beyond results. Available to any founder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pool Size</p>
              <p className="text-lg font-bold font-mono">{BONUS_POOL_TOTAL}%</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Awarded</p>
              <p className="text-lg font-bold font-mono">{totalBonusAwarded.toFixed(2)}%</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${bonusPoolRemaining > 2 ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold font-mono">{bonusPoolRemaining.toFixed(2)}%</p>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
            <p className="font-medium">Pre-defined Bonus Milestones:</p>
            <div className="mt-2 space-y-2">
              <div className="p-2 bg-background rounded border">
                <p className="font-medium text-sm">Celebrity Brand Distribution</p>
                <p className="text-muted-foreground">Getting celebrities involved for brand distribution that <span className="font-medium text-foreground">actually converts</span>.</p>
                <p className="mt-1">• 1 celebrity partnership signed + traceable conversions → 0.5%</p>
                <p>• 3+ celebrities with measurable ROI (CAC below target) → 1.0%</p>
                <p className="mt-1 text-muted-foreground italic">Measured by: signed contract + UTM-tracked signups/purchases attributed to that celebrity. &quot;Interest&quot; or DMs do not count.</p>
              </div>
              <div className="p-2 bg-background rounded border">
                <p className="font-medium text-sm">Investor That Moved the Needle</p>
                <p className="text-muted-foreground">Bringing in an investor whose money/involvement materially changed the company trajectory.</p>
                <p className="mt-1">• Intro that leads to signed + funded SAFE/round → 0.5%</p>
                <p>• Lead investor for seed round ($500K+) → 1.0%</p>
                <p>• Strategic investor (opens doors: YC, major partner, distribution) → 0.75%</p>
                <p className="mt-1 text-muted-foreground italic">Measured by: wire received in company bank account. &quot;Committed&quot; = money in, not verbal interest. The person who made the intro AND shepherded the close gets credit.</p>
              </div>
              <div className="p-2 bg-background rounded border">
                <p className="font-medium text-sm">User Growth (Above Plan)</p>
                <p className="text-muted-foreground">Driving user numbers significantly above the agreed target.</p>
                <p className="mt-1">• 2x target users/month sustained for 60 days → 0.5%</p>
                <p>• 5x target (viral event / breakout) → 1.0%</p>
                <p className="mt-1 text-muted-foreground italic">Measured by: billing system active user count (not downloads, not signups — active users who completed onboarding). Sustained = 60+ consecutive days.</p>
              </div>
              <div className="p-2 bg-background rounded border">
                <p className="font-medium text-sm">Revenue Milestones</p>
                <p className="text-muted-foreground">Revenue achievements outside normal responsibilities.</p>
                <p className="mt-1">• First $10K MRR → 0.25% (split among drivers)</p>
                <p>• First $50K MRR → 0.5% (split among drivers)</p>
                <p>• Peptide deal closed + funded → 0.5%</p>
                <p className="mt-1 text-muted-foreground italic">Measured by: Stripe/bank revenue, not projections or LOIs.</p>
              </div>
            </div>
            <Separator className="my-3" />
            <p className="font-medium">Rules (non-negotiable):</p>
            <p>• Cannot earn bonus for doing your normal job at plan</p>
            <p>• Open to ANY founder — whoever drove the result</p>
            <p>• Requires <span className="font-medium">completed</span> result (money in bank, users counted, contract signed)</p>
            <p>• Board vote required to award</p>
            <p>• &quot;Who measures it?&quot; — billing system, bank statements, signed contracts. Never vanity metrics, never self-reported.</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="font-medium">Award Bonus</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Founder</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={bonusForm.founderId}
                  onChange={(e) => setBonusForm({ ...bonusForm, founderId: e.target.value })}
                >
                  <option value="">Select...</option>
                  {founders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">What they achieved</Label>
                <Input
                  placeholder="e.g. 5x user growth target"
                  value={bonusForm.description}
                  onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Equity %</Label>
                <Input
                  type="number"
                  step={0.25}
                  min={0.25}
                  max={bonusPoolRemaining}
                  value={bonusForm.amount}
                  onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={!bonusForm.founderId || !bonusForm.description || bonusForm.amount <= 0 || bonusForm.amount > bonusPoolRemaining}
              onClick={() => awardBonus(bonusForm.founderId, bonusForm.description, bonusForm.amount)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Award Bonus ({bonusForm.amount}%)
            </Button>
          </div>

          {/* Awarded milestones */}
          {founders.some((f) => (f.bonusMilestones || []).length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="font-medium">Awarded Bonuses</Label>
                {founders.map((f) =>
                  (f.bonusMilestones || []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">{f.name}</span>
                        <span className="text-muted-foreground">— {m.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-green-600">+{m.equityAmount}%</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.earnedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Milestone Equity Lock-In */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-500" />
            Milestone Equity Lock-In
          </CardTitle>
          <CardDescription>
            When founders hit big numbers, their equity locks in permanently — can&apos;t be clawed back even if they leave.
            Total locked: <span className="font-mono font-bold">{totalLockedEquity.toFixed(1)}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs space-y-1">
            <p className="font-medium">How lock-in works:</p>
            <p>1. Define a milestone with a hard number (e.g., &quot;10,000 paid users&quot;)</p>
            <p>2. Attach equity % to that milestone (e.g., &quot;locks in 5%&quot;)</p>
            <p>3. When achieved + verified by the board, equity is <span className="font-bold">permanently locked</span></p>
            <p>4. Locked equity survives departure — even bad leaver keeps locked shares</p>
            <p>5. Unvested equity beyond locked amount follows normal vesting rules</p>
            <p className="mt-2 text-muted-foreground italic">Example: Founder requests 20%. If they lock 10% via milestones then leave, they keep 10% locked + whatever time-vested from remaining 10%.</p>
          </div>

          {/* Per-founder milestone status */}
          {founders.map((f) => {
            const milestones = f.equityMilestones || [];
            const lockedTotal = milestones.filter((m) => m.achieved).reduce((s, m) => s + m.equityPercent, 0);
            const pendingTotal = milestones.filter((m) => !m.achieved).reduce((s, m) => s + m.equityPercent, 0);

            return (
              <div key={f.id} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Requesting {f.requestedEquity || 0}% — Locked: {lockedTotal.toFixed(1)}% — Pending: {pendingTotal.toFixed(1)}%
                    </p>
                  </div>
                  {lockedTotal > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                      <Lock className="h-3 w-3 mr-1" />
                      {lockedTotal.toFixed(1)}% Locked
                    </Badge>
                  )}
                </div>

                {milestones.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-2 rounded border text-sm ${
                          m.achieved
                            ? "bg-blue-500/5 border-blue-500/30"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {m.achieved ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span className={m.achieved ? "text-blue-600 font-medium" : ""}>
                            {m.kpiName}: {m.targetValue.toLocaleString()} {m.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {m.equityPercent}%
                          </span>
                          {m.achieved ? (
                            <Badge variant="outline" className="text-blue-600 text-xs">
                              Locked {m.achievedDate && new Date(m.achievedDate).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() => {
                                if (confirm(`Confirm: ${f.name} achieved "${m.kpiName}: ${m.targetValue.toLocaleString()} ${m.unit}"? This permanently locks ${m.equityPercent}% equity.`)) {
                                  achieveMilestone(f.id, m.id);
                                }
                              }}
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Lock In
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {milestones.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">No milestones defined yet.</p>
                )}
              </div>
            );
          })}

          <Separator />

          {/* Add milestone form */}
          <div className="space-y-3">
            <Label className="font-medium">Add Lock-In Milestone</Label>
            <div className="grid grid-cols-5 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Founder</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={milestoneForm.founderId}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, founderId: e.target.value })}
                >
                  <option value="">Select...</option>
                  {founders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">KPI / Milestone</Label>
                <Input
                  placeholder="e.g. Paid users"
                  value={milestoneForm.kpiName}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, kpiName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target #</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={milestoneForm.targetValue || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, targetValue: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input
                  placeholder="users"
                  value={milestoneForm.unit}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, unit: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Locks %</Label>
                <Input
                  type="number"
                  step={0.5}
                  min={0.5}
                  max={20}
                  placeholder="5"
                  value={milestoneForm.equityPercent || ""}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, equityPercent: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button
              size="sm"
              disabled={
                !milestoneForm.founderId ||
                !milestoneForm.kpiName ||
                milestoneForm.targetValue <= 0 ||
                !milestoneForm.unit ||
                milestoneForm.equityPercent <= 0
              }
              onClick={() =>
                addMilestone(
                  milestoneForm.founderId,
                  milestoneForm.kpiName,
                  milestoneForm.targetValue,
                  milestoneForm.unit,
                  milestoneForm.equityPercent
                )
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
