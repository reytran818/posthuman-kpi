"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";
import type { Founder } from "@/lib/kpi-engine";

interface AIAnalysisProps {
  founders: Founder[];
}

export function AIAnalysis({ founders }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const hasAutoRun = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const prevFoundersHash = useRef<string>("");

  const runAnalysis = useCallback(async () => {
    if (founders.length === 0) return;
    setIsLoading(true);
    setAnalysis("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founders }),
      });

      if (!res.ok || !res.body) {
        setAnalysis("Failed to get AI analysis. Check API configuration.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setAnalysis(text);
      }

      setLastRun(new Date().toISOString());
    } catch {
      setAnalysis("Error connecting to AI. The analysis will be available when the API is configured.");
    } finally {
      setIsLoading(false);
    }
  }, [founders]);

  // Auto-run on first load when founders are available
  useEffect(() => {
    if (founders.length > 0 && !hasAutoRun.current) {
      hasAutoRun.current = true;
      runAnalysis();
    }
  }, [founders, runAnalysis]);

  // Auto-trigger when founders data changes (debounced 10s to avoid spam)
  useEffect(() => {
    const hash = JSON.stringify(founders.map(f => ({
      id: f.id,
      kpis: f.kpis?.length,
      hours: f.hoursPerWeek,
      equity: f.requestedEquity,
      kpiStatuses: f.kpis?.map((k: { status?: string }) => k.status).join(","),
      warnings: f.warnings?.length,
    })));

    if (prevFoundersHash.current && hash !== prevFoundersHash.current && !isLoading) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        runAnalysis();
      }, 10000);
    }
    prevFoundersHash.current = hash;

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [founders, isLoading, runAnalysis]);

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Auto-Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastRun && (
              <span className="text-xs text-muted-foreground">
                Updated: {new Date(lastRun).toLocaleTimeString()}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={runAnalysis}
              disabled={isLoading || founders.length === 0}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Analyzing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isLoading && (
          <p className="text-sm text-muted-foreground">
            AI analysis will auto-run when founder data is loaded.
          </p>
        )}
        {isLoading && !analysis && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>AI is analyzing {founders.length} founders...</span>
          </div>
        )}
        {analysis && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
