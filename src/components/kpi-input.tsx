"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Founder, KPI, KPICategory } from "@/lib/kpi-engine";
import { kpiToEnterpriseValue } from "@/lib/kpi-engine";
import { AIChat } from "@/components/ai-chat";
import { Plus, Trash2, ArrowRight, Sparkles, Target } from "lucide-react";

interface KPIInputProps {
  founders: Founder[];
  setFounders: (founders: Founder[]) => void;
  onComplete: () => void;
}

const CATEGORIES: { value: KPICategory; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "product", label: "Product" },
  { value: "technical", label: "Technical" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "fundraising", label: "Fundraising" },
  { value: "leadership", label: "Leadership" },
  { value: "culture", label: "Culture" },
];

const DIFFICULTIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "extreme", label: "Extreme" },
];

export function KPIInput({ founders, setFounders, onComplete }: KPIInputProps) {
  const [selectedFounder, setSelectedFounder] = useState<string>(
    founders[0]?.id || ""
  );
  const [showChat, setShowChat] = useState(false);
  const [kpiForm, setKpiForm] = useState({
    name: "",
    description: "",
    category: "product" as KPICategory,
    targetValue: 100,
    unit: "",
    weight: 50,
    timeframeMonths: 12,
    difficulty: "medium" as "low" | "medium" | "high" | "extreme",
  });

  const activeFounder = founders.find((f) => f.id === selectedFounder);

  function addKPI() {
    if (!kpiForm.name || !kpiForm.unit || !activeFounder) return;

    const newKPI: KPI = {
      id: crypto.randomUUID(),
      ...kpiForm,
    };

    setFounders(
      founders.map((f) =>
        f.id === selectedFounder ? { ...f, kpis: [...f.kpis, newKPI] } : f
      )
    );

    setKpiForm({
      name: "",
      description: "",
      category: "product",
      targetValue: 100,
      unit: "",
      weight: 50,
      timeframeMonths: 12,
      difficulty: "medium",
    });
  }

  function removeKPI(founderId: string, kpiId: string) {
    setFounders(
      founders.map((f) =>
        f.id === founderId
          ? { ...f, kpis: f.kpis.filter((k) => k.id !== kpiId) }
          : f
      )
    );
  }

  const hasAnyKPIs = founders.some((f) => f.kpis.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Define KPIs
          </h2>
          <p className="text-muted-foreground mt-1">
            Set measurable KPIs for each founder. These will determine equity
            allocation based on enterprise value contribution.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowChat(!showChat)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {showChat ? "Hide" : "AI"} Assistant
        </Button>
      </div>

      <div className={`grid gap-6 ${showChat ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-6">
          <div className="flex gap-2">
            {founders.map((f) => (
              <Button
                key={f.id}
                variant={selectedFounder === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFounder(f.id)}
              >
                {f.name}
                {f.kpis.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {f.kpis.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                New KPI for {activeFounder?.name}
              </CardTitle>
              <CardDescription>
                {activeFounder?.role} — Define a measurable outcome that
                contributes to company value.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>KPI Name</Label>
                  <Input
                    placeholder="e.g., Monthly Recurring Revenue"
                    value={kpiForm.name}
                    onChange={(e) =>
                      setKpiForm({ ...kpiForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={kpiForm.category}
                    onValueChange={(v) =>
                      setKpiForm({ ...kpiForm, category: v as KPICategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="What does achieving this look like?"
                  value={kpiForm.description}
                  onChange={(e) =>
                    setKpiForm({ ...kpiForm, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    value={kpiForm.targetValue}
                    onChange={(e) =>
                      setKpiForm({
                        ...kpiForm,
                        targetValue: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    placeholder="$, users, %, etc."
                    value={kpiForm.unit}
                    onChange={(e) =>
                      setKpiForm({ ...kpiForm, unit: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeframe (months)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={kpiForm.timeframeMonths}
                    onChange={(e) =>
                      setKpiForm({
                        ...kpiForm,
                        timeframeMonths: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Weight (Importance): {kpiForm.weight}
                </Label>
                <Slider
                  value={[kpiForm.weight]}
                  onValueChange={([v]) =>
                    setKpiForm({ ...kpiForm, weight: v })
                  }
                  min={1}
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  How important is this KPI relative to others? Higher = more
                  impact on equity allocation.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={kpiForm.difficulty}
                  onValueChange={(v) =>
                    setKpiForm({
                      ...kpiForm,
                      difficulty: v as "low" | "medium" | "high" | "extreme",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addKPI} className="w-full" disabled={!kpiForm.name || !kpiForm.unit}>
                <Plus className="h-4 w-4 mr-2" />
                Add KPI
              </Button>
            </CardContent>
          </Card>

          {activeFounder && activeFounder.kpis.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {activeFounder.name}&apos;s KPIs ({activeFounder.kpis.length})
              </h3>
              {activeFounder.kpis.map((kpi) => (
                <Card key={kpi.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{kpi.name}</p>
                          <Badge variant="outline">{kpi.category}</Badge>
                          <Badge
                            variant={
                              kpi.difficulty === "extreme"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {kpi.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Target: {kpi.targetValue} {kpi.unit} in{" "}
                          {kpi.timeframeMonths} months • Weight: {kpi.weight}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          Enterprise Value Score:{" "}
                          {kpiToEnterpriseValue(kpi).toFixed(1)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKPI(activeFounder.id, kpi.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {showChat && (
          <div className="space-y-4">
            <AIChat founderRole={activeFounder?.role || ""} />
          </div>
        )}
      </div>

      <Separator />

      {hasAnyKPIs && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            View Results
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
