"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FounderSetup } from "@/components/founder-setup";
import { KPIInput } from "@/components/kpi-input";
import { ResultsDashboard } from "@/components/results-dashboard";
import type { Founder } from "@/lib/kpi-engine";
import { Users, Target, BarChart3 } from "lucide-react";

export default function Home() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [activeTab, setActiveTab] = useState("founders");

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            AI-Assisted
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
        </Tabs>
      </div>
    </main>
  );
}
