"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FounderSetup } from "@/components/founder-setup";
import { KPIInput } from "@/components/kpi-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Founder } from "@/lib/kpi-engine";
import { Users, Target, BarChart3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [founders, setFounders, isHydrated] = useLocalStorage<Founder[]>(
    "posthuman-founders",
    []
  );
  const [activeTab, setActiveTab] = useLocalStorage<string>(
    "posthuman-active-tab",
    "founders"
  );
  const [, setLastUpdated] = useLocalStorage<string>(
    "posthuman-last-updated",
    ""
  );

  function updateFounders(newFounders: Founder[]) {
    setFounders(newFounders);
    setLastUpdated(new Date().toISOString());
  }

  function resetAll() {
    if (confirm("Reset all data? This cannot be undone.")) {
      setFounders([]);
      setActiveTab("founders");
      setLastUpdated("");
    }
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              AI-Assisted • Auto-saved
            </div>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
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
          </TabsList>

          <TabsContent value="founders" className="mt-6">
            <FounderSetup
              founders={founders}
              setFounders={updateFounders}
              onComplete={() => setActiveTab("kpis")}
            />
          </TabsContent>

          <TabsContent value="kpis" className="mt-6">
            <KPIInput
              founders={founders}
              setFounders={updateFounders}
              onComplete={() => setActiveTab("results")}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsDashboard founders={founders} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
