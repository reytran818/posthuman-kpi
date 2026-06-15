"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FounderSetup } from "@/components/founder-setup";
import { KPIInput } from "@/components/kpi-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { LegalFramework } from "@/components/legal-framework";
import { TransparencyDisclosure } from "@/components/transparency-disclosure";
import { Operations } from "@/components/operations";
import { Accountability } from "@/components/accountability";
import { SanityCheck } from "@/components/sanity-check";
import { Recommendations } from "@/components/recommendations";
import { InvestorSummary } from "@/components/investor-summary";
import { useSharedFounders } from "@/hooks/use-shared-founders";
import {
  Users,
  Target,
  BarChart3,
  RotateCcw,
  Cloud,
  Shield,
  Eye,
  Save,
  Wrench,
  RefreshCw,
  Scale,
  ClipboardCheck,
  Lightbulb,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { founders, setFounders, isLoading, isSaving, lastSaved, saveNow, refresh, resetAll } =
    useSharedFounders();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading shared data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background print:bg-white">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50 print:static print:border-b-0">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">P</span>
                </div>
                <div>
                  <h1 className="text-base font-semibold tracking-tight leading-tight">
                    Posthuman Inc.
                  </h1>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Founders Agreement & Equity Platform
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground">Claude Opus 4 · Bedrock</span>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mr-2">
                <Cloud className="h-3 w-3 text-emerald-500" />
                <span>
                  {isSaving ? "Saving..." : "Synced"}
                  {lastSaved && !isSaving && (
                    <span className="hidden sm:inline"> · {new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={refresh} disabled={isSaving} className="h-7 px-2">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="default" size="sm" onClick={saveNow} disabled={isSaving} className="h-7 px-3 text-xs">
                <Save className="h-3 w-3 mr-1" />
                {isSaving ? "Saving" : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
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
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 print:py-2 print:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-10 h-9 print:hidden">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Presentation className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="founders" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              Founders
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-1.5 text-xs" disabled={founders.length === 0}>
              <Target className="h-3.5 w-3.5" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5 text-xs" disabled={founders.every((f) => f.kpis.length === 0)}>
              <BarChart3 className="h-3.5 w-3.5" />
              Results
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 text-xs" disabled={founders.every((f) => f.kpis.length === 0)}>
              <Lightbulb className="h-3.5 w-3.5" />
              Recs
            </TabsTrigger>
            <TabsTrigger value="sanity" className="gap-1.5 text-xs" disabled={founders.every((f) => f.kpis.length === 0)}>
              <ClipboardCheck className="h-3.5 w-3.5" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="equity" className="gap-1.5 text-xs" disabled={founders.length === 0}>
              <Scale className="h-3.5 w-3.5" />
              Equity
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-1.5 text-xs" disabled={founders.length === 0}>
              <Shield className="h-3.5 w-3.5" />
              Legal
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-1.5 text-xs" disabled={founders.length === 0}>
              <Wrench className="h-3.5 w-3.5" />
              Ops
            </TabsTrigger>
            <TabsTrigger value="transparency" className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              Disclosure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <InvestorSummary founders={founders} />
          </TabsContent>

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

          <TabsContent value="recommendations" className="mt-6">
            <Recommendations founders={founders} />
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
