"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FounderSetup } from "@/components/founder-setup";
import { KPIInput } from "@/components/kpi-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import { LegalFramework } from "@/components/legal-framework";
import { TransparencyDisclosure } from "@/components/transparency-disclosure";
import { useSharedFounders } from "@/hooks/use-shared-founders";
import { Users, Target, BarChart3, RotateCcw, Cloud, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { founders, setFounders, isLoading, lastSaved, resetAll } =
    useSharedFounders();
  const [activeTab, setActiveTab] = useState("founders");

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
                Synced
                {lastSaved && (
                  <> • {new Date(lastSaved).toLocaleTimeString()}</>
                )}
              </span>
            </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
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
              value="legal"
              className="gap-2"
              disabled={founders.length === 0}
            >
              <Shield className="h-4 w-4" />
              Legal
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

          <TabsContent value="legal" className="mt-6">
            <LegalFramework founders={founders} />
          </TabsContent>

          <TabsContent value="transparency" className="mt-6">
            <TransparencyDisclosure />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
