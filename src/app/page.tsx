"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FounderSetup } from "@/components/founder-setup";
import { KPIInput } from "@/components/kpi-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { LegalFramework } from "@/components/legal-framework";
import { TransparencyDisclosure } from "@/components/transparency-disclosure";
import { Operations } from "@/components/operations";
import { Accountability } from "@/components/accountability";
import { SanityCheck } from "@/components/sanity-check";
import { useSharedFounders } from "@/hooks/use-shared-founders";
import { EMPLOYEE_OPTION_POOL } from "@/lib/kpi-engine";
import { Users, Target, BarChart3, RotateCcw, Cloud, Shield, Eye, Save, Wrench, RefreshCw, Scale, ClipboardCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { founders, setFounders, isLoading, isSaving, lastSaved, saveNow, refresh, resetAll } =
    useSharedFounders();
  const [activeTab, setActiveTab] = useState("founders");

  const mathIssues = useMemo(() => {
    if (founders.length === 0) return [];
    const issues: string[] = [];
    const totalRequested = founders.reduce((s, f) => s + (f.requestedEquity || 0), 0);
    const founderPool = 100 - EMPLOYEE_OPTION_POOL;
    if (totalRequested > founderPool) {
      issues.push(`Total requested (${totalRequested}%) > founder pool (${founderPool}%)`);
    }
    for (const f of founders) {
      if ((f.requestedEquity || 0) > 50) issues.push(`${f.name} requests ${f.requestedEquity}% (>50%)`);
      for (const k of f.kpis) {
        if (k.targetValue <= 0) issues.push(`${f.name}: "${k.name}" has target ≤ 0`);
        if (k.weight > 100) issues.push(`${f.name}: "${k.name}" has weight > 100`);
        if (k.timeframeMonths < 1 || k.timeframeMonths > 60) issues.push(`${f.name}: "${k.name}" has invalid timeframe`);
      }
      for (const c of (f.contributions || [])) {
        if (c.estimatedValue < 0) issues.push(`${f.name}: contribution has negative value`);
      }
      if (f.commitmentStatus === "full_time" && (f.hoursPerWeek || 0) < 30) {
        issues.push(`${f.name}: "full-time" but ${f.hoursPerWeek}h/wk`);
      }
    }
    const totalBonus = founders.reduce((s, f) => s + (f.bonusEquityEarned || 0), 0);
    if (totalRequested + EMPLOYEE_OPTION_POOL + totalBonus > 100) {
      issues.push(`Grand total exceeds 100%`);
    }
    return issues;
  }, [founders]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading shared data...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Posthuman Inc.
            </h1>
            <p className="text-sm text-muted-foreground">
              Founders Agreement — KPI & Equity Allocation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Cloud className="h-3.5 w-3.5 text-green-500" />
              <span>
                {isSaving ? "Saving..." : "Saved"}
                {lastSaved && !isSaving && (
                  <> • {new Date(lastSaved).toLocaleTimeString()}</>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isSaving}
              title="Pull latest data from server"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveNow}
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Reset all data for everyone? This cannot be undone.")) {
                  resetAll();
                  setActiveTab("founders");
                }
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {mathIssues.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">
                {mathIssues.length} Math Issue{mathIssues.length > 1 ? "s" : ""} — Numbers Don&apos;t Add Up
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs text-destructive"
                onClick={() => setActiveTab("sanity")}
              >
                View Details →
              </Button>
            </div>
            <div className="text-xs text-destructive/80 space-y-0.5">
              {mathIssues.slice(0, 3).map((issue, i) => (
                <p key={i}>• {issue}</p>
              ))}
              {mathIssues.length > 3 && <p>...and {mathIssues.length - 3} more</p>}
            </div>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="founders" className="gap-2">
              <Users className="h-4 w-4" />
              Founders
            </TabsTrigger>
            <TabsTrigger
              value="kpis"
              className="gap-2"
              disabled={founders.length === 0}
            >
              <Target className="h-4 w-4" />
              KPIs
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="gap-2"
              disabled={founders.every((f) => f.kpis.length === 0)}
            >
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger
              value="sanity"
              className="gap-2"
              disabled={founders.every((f) => f.kpis.length === 0)}
            >
              <ClipboardCheck className="h-4 w-4" />
              Sanity
            </TabsTrigger>
            <TabsTrigger
              value="equity"
              className="gap-2"
              disabled={founders.length === 0}
            >
              <Scale className="h-4 w-4" />
              Equity
            </TabsTrigger>
            <TabsTrigger
              value="legal"
              className="gap-2"
              disabled={founders.length === 0}
            >
              <Shield className="h-4 w-4" />
              Legal
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="gap-2"
              disabled={founders.length === 0}
            >
              <Wrench className="h-4 w-4" />
              Ops
            </TabsTrigger>
            <TabsTrigger value="transparency" className="gap-2">
              <Eye className="h-4 w-4" />
              Disclosure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="founders" className="mt-6">
            <FounderSetup
              founders={founders}
              setFounders={setFounders}
              onComplete={() => setActiveTab("kpis")}
            />
          </TabsContent>

          <TabsContent value="kpis" className="mt-6">
            <KPIInput
              founders={founders}
              setFounders={setFounders}
              onComplete={() => setActiveTab("results")}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsDashboard founders={founders} />
          </TabsContent>

          <TabsContent value="sanity" className="mt-6">
            <SanityCheck founders={founders} />
          </TabsContent>

          <TabsContent value="equity" className="mt-6">
            <Accountability founders={founders} setFounders={setFounders} />
          </TabsContent>

          <TabsContent value="legal" className="mt-6">
            <LegalFramework founders={founders} />
          </TabsContent>

          <TabsContent value="operations" className="mt-6">
            <Operations founders={founders} setFounders={setFounders} />
          </TabsContent>

          <TabsContent value="transparency" className="mt-6">
            <TransparencyDisclosure />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
