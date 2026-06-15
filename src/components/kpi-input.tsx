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
import { Plus, Trash2, ArrowRight, Sparkles, Target, AlertTriangle, Pencil, Check, X } from "lucide-react";

interface KPIInputProps {
  founders: Founder[];
  setFounders: (founders: Founder[]) => void;
  onComplete: () => void;
}

function validateKPIHardNumbers(kpi: { name: string; description: string; targetValue: number; unit: string }): string[] {
  const issues: string[] = [];
  const text = `${kpi.name} ${kpi.description}`;

  if (/\[set\s*(#|date|amount|%)\]/i.test(text)) {
    issues.push("Contains placeholder [set ...] — fill in actual numbers");
  }
  if (/\b(approximately|about|around|roughly|~)\b/i.test(text)) {
    issues.push("Vague language — use exact numbers");
  }
  if (/\b(some|several|many|a few|various)\b/i.test(text)) {
    issues.push("Non-specific quantity — replace with a hard number");
  }
  if (/\b(try to|attempt to|aim to|hope to|plan to)\b/i.test(text)) {
    issues.push("Weak commitment language — state what WILL be delivered");
  }
  if (kpi.targetValue <= 0) {
    issues.push("Target value must be > 0");
  }
  if (!kpi.unit.trim()) {
    issues.push("Must specify a measurable unit");
  }
  if (/\b(percentage|%|percent)\b/i.test(kpi.unit) && kpi.targetValue <= 0) {
    issues.push("Percentages need a concrete base number");
  }
  return issues;
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
  const [showDealFields, setShowDealFields] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number>>({});
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiReasoning, setAiReasoning] = useState("");
  const [showManualFields, setShowManualFields] = useState(false);
  const [bulkRegenerating, setBulkRegenerating] = useState(false);
  const [kpiForm, setKpiForm] = useState({
    name: "",
    description: "",
    category: "product" as KPICategory,
    targetValue: 100,
    unit: "",
    weight: 50,
    timeframeMonths: 12,
    difficulty: "medium" as "low" | "medium" | "high" | "extreme",
    dealType: "standard" as "standard" | "equity_exchange" | "investment" | "revenue_share" | "flat_fee",
    theyGet: "",
    weGet: "",
    successCriteria: "",
  });

  const activeFounder = founders.find((f) => f.id === selectedFounder);

  function addKPI() {
    if (!kpiForm.name || !kpiForm.unit || !activeFounder) return;

    const newKPI: KPI = {
      id: crypto.randomUUID(),
      name: kpiForm.name,
      description: kpiForm.description,
      category: kpiForm.category,
      targetValue: kpiForm.targetValue,
      unit: kpiForm.unit,
      weight: kpiForm.weight,
      timeframeMonths: kpiForm.timeframeMonths,
      difficulty: kpiForm.difficulty,
      ...(kpiForm.dealType !== "standard" && {
        dealType: kpiForm.dealType,
        theyGet: kpiForm.theyGet,
        weGet: kpiForm.weGet,
        successCriteria: kpiForm.successCriteria,
      }),
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
      dealType: "standard",
      theyGet: "",
      weGet: "",
      successCriteria: "",
    });
    setShowDealFields(false);
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

  function startEdit(kpi: KPI) {
    setEditingKPI(kpi.id);
    setEditForm({
      name: kpi.name,
      description: kpi.description,
      targetValue: kpi.targetValue,
      unit: kpi.unit,
      weight: kpi.weight,
      timeframeMonths: kpi.timeframeMonths,
      difficulty: kpi.difficulty,
      theyGet: kpi.theyGet || "",
      weGet: kpi.weGet || "",
      successCriteria: kpi.successCriteria || "",
    });
  }

  function saveEdit(founderId: string, kpiId: string) {
    setFounders(
      founders.map((f) =>
        f.id === founderId
          ? {
              ...f,
              kpis: f.kpis.map((k) =>
                k.id === kpiId
                  ? {
                      ...k,
                      name: editForm.name as string,
                      description: editForm.description as string,
                      targetValue: Number(editForm.targetValue),
                      unit: editForm.unit as string,
                      weight: Number(editForm.weight),
                      timeframeMonths: Number(editForm.timeframeMonths),
                      difficulty: editForm.difficulty as KPI["difficulty"],
                      theyGet: (editForm.theyGet as string) || undefined,
                      weGet: (editForm.weGet as string) || undefined,
                      successCriteria: (editForm.successCriteria as string) || undefined,
                    }
                  : k
              ),
            }
          : f
      )
    );
    setEditingKPI(null);
  }

  function cancelEdit() {
    setEditingKPI(null);
    setEditForm({});
  }

  async function aiSuggestValues() {
    if (!kpiForm.name) return;
    setAiSuggesting(true);
    setAiReasoning("");
    try {
      const existingKPIs = activeFounder?.kpis.map((k) => k.name).join(", ");
      const res = await fetch("/api/suggest-kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionItem: kpiForm.name,
          role: activeFounder?.role,
          existingKPIs,
        }),
      });
      if (res.ok) {
        const suggestion = await res.json();
        if (suggestion.error) {
          setAiReasoning(`Error: ${suggestion.error}`);
          return;
        }
        setKpiForm((prev) => ({
          ...prev,
          name: suggestion.name || prev.name,
          description: suggestion.description || prev.description,
          category: suggestion.category || prev.category,
          targetValue: suggestion.targetValue || prev.targetValue,
          unit: suggestion.unit || prev.unit,
          weight: suggestion.weight || prev.weight,
          timeframeMonths: suggestion.timeframeMonths || prev.timeframeMonths,
          difficulty: suggestion.difficulty || prev.difficulty,
          dealType: suggestion.dealType || "standard",
          theyGet: suggestion.theyGet || "",
          weGet: suggestion.weGet || "",
          successCriteria: suggestion.successCriteria || "",
        }));
        setAiReasoning(suggestion.reasoning || "Generated successfully.");
      } else {
        const err = await res.text();
        setAiReasoning(`Failed (${res.status}): ${err.substring(0, 100)}`);
      }
    } catch (e) {
      setAiReasoning(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setAiSuggesting(false);
    }
  }

  const hasAnyKPIs = founders.some((f) => f.kpis.length > 0);

  async function bulkRegenerate() {
    if (!hasAnyKPIs) return;
    if (!confirm("This will regenerate ALL KPIs for ALL founders with AI-calculated hard numbers. Existing values will be replaced. Continue?")) return;
    setBulkRegenerating(true);
    try {
      const res = await fetch("/api/regenerate-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founders }),
      });
      if (res.ok) {
        const { founders: updated } = await res.json();
        setFounders(updated);
      }
    } catch {
      // silently fail
    } finally {
      setBulkRegenerating(false);
    }
  }

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
          <p className="text-xs text-orange-500 font-medium mt-2">
            All KPIs must have hard numbers — no placeholders, no vague language, no &quot;try to.&quot;
          </p>
        </div>
        <div className="flex gap-2">
          {hasAnyKPIs && (
            <Button
              variant="secondary"
              onClick={bulkRegenerate}
              disabled={bulkRegenerating}
              className="gap-2"
            >
              <Sparkles className={`h-4 w-4 ${bulkRegenerating ? "animate-spin" : ""}`} />
              {bulkRegenerating ? "Regenerating all..." : "Regenerate All KPIs with AI"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowChat(!showChat)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {showChat ? "Hide" : "AI"} Assistant
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showChat ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            {founders.map((f) => {
              const kpiIssues = f.kpis.filter(
                (k) => validateKPIHardNumbers(k).length > 0
              ).length;
              return (
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
                {kpiIssues > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {kpiIssues} ⚠
                  </Badge>
                )}
              </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                New KPI for {activeFounder?.name}
              </CardTitle>
              <CardDescription>
                {activeFounder?.role} — Just describe what you&apos;ll deliver. AI generates the numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI-First Input */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>What will you deliver?</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Get the product to A-list celebrities for brand distribution"
                      value={kpiForm.name}
                      onChange={(e) =>
                        setKpiForm({ ...kpiForm, name: e.target.value })
                      }
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && kpiForm.name && !aiSuggesting) {
                          aiSuggestValues();
                        }
                      }}
                    />
                    <Button
                      onClick={aiSuggestValues}
                      disabled={!kpiForm.name || aiSuggesting}
                      className="gap-2 shrink-0"
                    >
                      <Sparkles className={`h-4 w-4 ${aiSuggesting ? "animate-spin" : ""}`} />
                      {aiSuggesting ? "Generating..." : "Generate with AI"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type your action item and hit Enter or click Generate. AI will set target, weight, difficulty, and timeframe.
                  </p>
                </div>

                {aiReasoning && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span className="font-medium text-purple-600 text-xs">AI Generated</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{aiReasoning}</p>
                  </div>
                )}
              </div>

              {/* Generated/editable fields (shown after AI generates or user expands) */}
              {(kpiForm.targetValue > 0 && kpiForm.unit) ? (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Generated Values (editable)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => setShowManualFields(!showManualFields)}
                    >
                      {showManualFields ? "Collapse" : "Edit details"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-background rounded border text-center">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-bold font-mono">{kpiForm.targetValue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{kpiForm.unit}</p>
                    </div>
                    <div className="p-2 bg-background rounded border text-center">
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-bold font-mono">{kpiForm.weight}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                    <div className="p-2 bg-background rounded border text-center">
                      <p className="text-xs text-muted-foreground">Difficulty</p>
                      <p className="font-bold capitalize">{kpiForm.difficulty}</p>
                    </div>
                    <div className="p-2 bg-background rounded border text-center">
                      <p className="text-xs text-muted-foreground">Timeframe</p>
                      <p className="font-bold font-mono">{kpiForm.timeframeMonths}</p>
                      <p className="text-xs text-muted-foreground">months</p>
                    </div>
                  </div>

                  {showManualFields && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="What does achieving this look like?"
                            value={kpiForm.description}
                            onChange={(e) =>
                              setKpiForm({ ...kpiForm, description: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
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

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Target Value</Label>
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
                          <Label className="text-xs">Unit</Label>
                          <Input
                            placeholder="users, deals, dollars..."
                            value={kpiForm.unit}
                            onChange={(e) =>
                              setKpiForm({ ...kpiForm, unit: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Timeframe (months)</Label>
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
                        <Label className="text-xs">
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
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Difficulty</Label>
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

                      {/* Deal Structure */}
                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setShowDealFields(!showDealFields)}
                        >
                          {showDealFields ? "− Hide" : "+ Edit"} Deal Structure
                        </Button>

                        {showDealFields && (
                          <div className="p-4 bg-background rounded-lg space-y-3 border border-dashed">
                            <div className="space-y-2">
                              <Label className="text-xs">Deal Type</Label>
                              <Select
                                value={kpiForm.dealType}
                                onValueChange={(v) =>
                                  setKpiForm({ ...kpiForm, dealType: v as typeof kpiForm.dealType })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard KPI (no deal)</SelectItem>
                                  <SelectItem value="equity_exchange">Equity Exchange</SelectItem>
                                  <SelectItem value="investment">Investment</SelectItem>
                                  <SelectItem value="revenue_share">Revenue Share</SelectItem>
                                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {kpiForm.dealType !== "standard" && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-xs">They Get</Label>
                                  <Input
                                    placeholder="What the other party receives"
                                    value={kpiForm.theyGet}
                                    onChange={(e) =>
                                      setKpiForm({ ...kpiForm, theyGet: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">We Get</Label>
                                  <Input
                                    placeholder="What Posthuman receives"
                                    value={kpiForm.weGet}
                                    onChange={(e) =>
                                      setKpiForm({ ...kpiForm, weGet: e.target.value })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Success Criteria</Label>
                                  <Input
                                    placeholder="How to verify achievement"
                                    value={kpiForm.successCriteria}
                                    onChange={(e) =>
                                      setKpiForm({ ...kpiForm, successCriteria: e.target.value })
                                    }
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button onClick={addKPI} className="w-full" disabled={!kpiForm.name || !kpiForm.unit || kpiForm.targetValue <= 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add KPI
                  </Button>
                  {kpiForm.name && validateKPIHardNumbers(kpiForm).length > 0 && (
                    <div className="p-2 bg-destructive/10 border border-destructive/30 rounded text-xs space-y-1">
                      <p className="font-medium text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Hard numbers required:
                      </p>
                      {validateKPIHardNumbers(kpiForm).map((issue, i) => (
                        <p key={i} className="text-destructive/80">• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowManualFields(!showManualFields)}
                >
                  {showManualFields ? "Hide" : "Or enter manually without AI"}
                </Button>
              )}

              {/* Manual entry fallback (no AI) */}
              {showManualFields && !(kpiForm.targetValue > 0 && kpiForm.unit) && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="What does achieving this look like?"
                        value={kpiForm.description}
                        onChange={(e) =>
                          setKpiForm({ ...kpiForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Category</Label>
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Target Value</Label>
                      <Input
                        type="number"
                        value={kpiForm.targetValue}
                        onChange={(e) =>
                          setKpiForm({ ...kpiForm, targetValue: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        placeholder="users, deals, dollars..."
                        value={kpiForm.unit}
                        onChange={(e) =>
                          setKpiForm({ ...kpiForm, unit: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Timeframe (months)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={kpiForm.timeframeMonths}
                        onChange={(e) =>
                          setKpiForm({ ...kpiForm, timeframeMonths: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Weight: {kpiForm.weight}</Label>
                    <Slider
                      value={[kpiForm.weight]}
                      onValueChange={([v]) => setKpiForm({ ...kpiForm, weight: v })}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Difficulty</Label>
                    <Select
                      value={kpiForm.difficulty}
                      onValueChange={(v) =>
                        setKpiForm({ ...kpiForm, difficulty: v as "low" | "medium" | "high" | "extreme" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addKPI} className="w-full" disabled={!kpiForm.name || !kpiForm.unit || kpiForm.targetValue <= 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add KPI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {activeFounder && activeFounder.kpis.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {activeFounder.name}&apos;s KPIs ({activeFounder.kpis.length})
              </h3>
              {activeFounder.kpis.map((kpi) => {
                const issues = validateKPIHardNumbers(kpi);
                const isEditing = editingKPI === kpi.id;

                if (isEditing) {
                  return (
                    <Card key={kpi.id} className="border-blue-500/50">
                      <CardContent className="py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Target</Label>
                            <Input
                              type="number"
                              value={editForm.targetValue}
                              onChange={(e) => setEditForm({ ...editForm, targetValue: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Weight (1-100)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={editForm.weight}
                              onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Months</Label>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={editForm.timeframeMonths}
                              onChange={(e) => setEditForm({ ...editForm, timeframeMonths: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Difficulty</Label>
                            <Select
                              value={editForm.difficulty as string}
                              onValueChange={(v) => setEditForm({ ...editForm, difficulty: v })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DIFFICULTIES.map((d) => (
                                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">They Get (deal)</Label>
                            <Input
                              placeholder="optional"
                              value={editForm.theyGet}
                              onChange={(e) => setEditForm({ ...editForm, theyGet: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">We Get (deal)</Label>
                            <Input
                              placeholder="optional"
                              value={editForm.weGet}
                              onChange={(e) => setEditForm({ ...editForm, weGet: e.target.value })}
                            />
                          </div>
                        </div>
                        {(editForm.theyGet || editForm.weGet) && (
                          <div className="space-y-1">
                            <Label className="text-xs">Success Criteria</Label>
                            <Input
                              placeholder="How is success measured? (hard numbers)"
                              value={editForm.successCriteria}
                              onChange={(e) => setEditForm({ ...editForm, successCriteria: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(activeFounder.id, kpi.id)}
                            disabled={!editForm.name || !editForm.unit || Number(editForm.targetValue) <= 0}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                <Card key={kpi.id} className={issues.length > 0 ? "border-orange-500/50" : ""}>
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
                          {issues.length > 0 && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs hard #
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Target: {kpi.targetValue} {kpi.unit} in{" "}
                          {kpi.timeframeMonths} months • Weight: {kpi.weight}
                        </p>
                        {kpi.description && (
                          <p className="text-xs text-muted-foreground">{kpi.description}</p>
                        )}
                        {kpi.dealType && kpi.dealType !== "standard" && (
                          <div className="mt-1 p-2 bg-muted rounded text-xs space-y-0.5">
                            <Badge className="text-xs mb-1" variant="outline">
                              {kpi.dealType === "equity_exchange" ? "Equity Exchange" :
                               kpi.dealType === "investment" ? "Investment" :
                               kpi.dealType === "revenue_share" ? "Revenue Share" : "Flat Fee"}
                            </Badge>
                            {kpi.theyGet && <p><span className="font-medium">They get:</span> {kpi.theyGet}</p>}
                            {kpi.weGet && <p><span className="font-medium">We get:</span> {kpi.weGet}</p>}
                            {kpi.successCriteria && <p><span className="font-medium">Success:</span> {kpi.successCriteria}</p>}
                          </div>
                        )}
                        <p className="text-xs font-mono text-muted-foreground">
                          Enterprise Value Score:{" "}
                          {kpiToEnterpriseValue(kpi).toFixed(1)}
                        </p>
                        {issues.length > 0 && (
                          <div className="mt-1 text-xs text-orange-500 space-y-0.5">
                            {issues.map((issue, i) => (
                              <p key={i}>⚠ {issue}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(kpi)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKPI(activeFounder.id, kpi.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>

        {showChat && (
          <div className="space-y-4">
            <AIChat founderRole={activeFounder?.role || ""} founders={founders} />
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
