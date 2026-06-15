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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Founder, Contribution, ContributionType, Attachment } from "@/lib/kpi-engine";
import { contributionToValue } from "@/lib/kpi-engine";
import { FileUpload } from "@/components/file-upload";
import {
  Plus,
  Trash2,
  ArrowRight,
  FileText,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

interface FounderSetupProps {
  founders: Founder[];
  setFounders: (founders: Founder[]) => void;
  onComplete: () => void;
}

const CONTRIBUTION_TYPES: { value: ContributionType; label: string; description: string }[] = [
  { value: "execution", label: "Execution / Building", description: "Hands-on work shipping product, closing deals, etc." },
  { value: "technical_build", label: "Technical Build", description: "Code, architecture, prototypes built" },
  { value: "revenue_generated", label: "Revenue Generated", description: "Actual revenue or contracts secured" },
  { value: "capital_invested", label: "Capital Invested", description: "Personal money put into the company" },
  { value: "ip_created", label: "IP Created", description: "Patents, proprietary tech, unique assets" },
  { value: "domain_expertise", label: "Domain Expertise", description: "Deep industry knowledge brought" },
  { value: "team_recruited", label: "Team Recruited", description: "Key hires or partnerships secured" },
  { value: "network_connections", label: "Network / Connections", description: "Introductions to investors, customers, partners" },
  { value: "market_research", label: "Market Research", description: "Validation, user research, competitive analysis" },
  { value: "idea_vision", label: "Idea / Vision", description: "Original concept or strategic direction" },
];

export function FounderSetup({
  founders,
  setFounders,
  onComplete,
}: FounderSetupProps) {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [expandedFounder, setExpandedFounder] = useState<string | null>(
    founders[0]?.id || null
  );
  const [newSkill, setNewSkill] = useState("");

  // Contribution form
  const [contribForm, setContribForm] = useState({
    description: "",
    type: "execution" as ContributionType,
    estimatedValue: 0,
    hoursInvested: 0,
  });

  function addFounder() {
    if (!newName.trim() || !newRole.trim()) return;
    const founder: Founder = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      role: newRole.trim(),
      requestedEquity: 0,
      commitmentStatus: "full_time",
      hoursPerWeek: 40,
      fullTimeDate: "",
      resume: "",
      yearsExperience: 0,
      relevantSkills: [],
      contributions: [],
      attachments: [],
      kpis: [],
    };
    setFounders([...founders, founder]);
    setNewName("");
    setNewRole("");
    setExpandedFounder(founder.id);
  }

  function removeFounder(id: string) {
    setFounders(founders.filter((f) => f.id !== id));
  }

  function updateFounder(id: string, updates: Partial<Founder>) {
    setFounders(
      founders.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  function addSkill(founderId: string) {
    if (!newSkill.trim()) return;
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    updateFounder(founderId, {
      relevantSkills: [...(founder.relevantSkills || []), newSkill.trim()],
    });
    setNewSkill("");
  }

  function removeSkill(founderId: string, index: number) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const skills = [...(founder.relevantSkills || [])];
    skills.splice(index, 1);
    updateFounder(founderId, { relevantSkills: skills });
  }

  function addContribution(founderId: string) {
    if (!contribForm.description.trim()) return;
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    const newContrib: Contribution = {
      id: crypto.randomUUID(),
      ...contribForm,
    };
    updateFounder(founderId, {
      contributions: [...(founder.contributions || []), newContrib],
    });
    setContribForm({
      description: "",
      type: "execution",
      estimatedValue: 0,
      hoursInvested: 0,
    });
  }

  function removeContribution(founderId: string, contribId: string) {
    const founder = founders.find((f) => f.id === founderId);
    if (!founder) return;
    updateFounder(founderId, {
      contributions: (founder.contributions || []).filter(
        (c) => c.id !== contribId
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Founders & Prior Contributions
        </h2>
        <p className="text-muted-foreground mt-1">
          Add each founder with their background, experience, and prior
          contributions to the company. Execution-based contributions are
          weighted significantly higher than ideas alone.
        </p>
      </div>

      <Card className="border-dashed border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Ideas vs Execution</p>
            <p>
              This algorithm weights execution at <strong>3.3×</strong> the value
              of ideas/vision. Ideas and vision score at 30% of base value,
              while actual building/shipping scores 100%. Both matter — ideas
              are the seed, execution grows the tree. Prior contributions
              account for 30% of equity; future KPI commitments account for 70%.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Founder</CardTitle>
          <CardDescription>
            Enter each founder&apos;s name and primary role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFounder()}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="role">Primary Role</Label>
              <Input
                id="role"
                placeholder="CEO, CTO, CPO..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFounder()}
              />
            </div>
            <Button onClick={addFounder} disabled={!newName || !newRole}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {founders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Founding Team ({founders.length})
          </h3>
          {founders.map((founder) => (
            <Card key={founder.id}>
              <CardContent className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{founder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {founder.role}
                      </p>
                    </div>
                    {(founder.contributions || []).length > 0 && (
                      <Badge variant="secondary">
                        {(founder.contributions || []).length} contributions
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`equity-${founder.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                        Requesting:
                      </Label>
                      <Input
                        id={`equity-${founder.id}`}
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 h-8 text-sm"
                        value={founder.requestedEquity || ""}
                        placeholder="%"
                        onChange={(e) =>
                          updateFounder(founder.id, {
                            requestedEquity: Number(e.target.value),
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedFounder(
                          expandedFounder === founder.id ? null : founder.id
                        )
                      }
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      {expandedFounder === founder.id ? "Collapse" : "Edit Profile & Contributions"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFounder(founder.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {expandedFounder === founder.id && (
                  <div className="space-y-6 pt-4 border-t border-border">
                    {/* Resume / Background */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Resume / Background
                      </Label>
                      <Textarea
                        placeholder="Paste resume summary, relevant experience, previous companies, notable achievements..."
                        value={founder.resume || ""}
                        onChange={(e) =>
                          updateFounder(founder.id, { resume: e.target.value })
                        }
                        className="min-h-[100px]"
                      />
                    </div>

                    {/* File Uploads */}
                    <div className="space-y-2">
                      <Label>Documents & Evidence</Label>
                      <p className="text-xs text-muted-foreground">
                        Upload resumes, contracts, screenshots, or any evidence
                        of contributions. The AI will analyze these files.
                      </p>
                      <FileUpload
                        founderId={founder.id}
                        attachments={founder.attachments || []}
                        onUpload={(attachment: Attachment) =>
                          updateFounder(founder.id, {
                            attachments: [
                              ...(founder.attachments || []),
                              attachment,
                            ],
                          })
                        }
                        onRemove={(attachmentId: string) =>
                          updateFounder(founder.id, {
                            attachments: (founder.attachments || []).filter(
                              (a) => a.id !== attachmentId
                            ),
                          })
                        }
                      />
                    </div>

                    {/* Years of Experience + Commitment Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Years of Relevant Experience</Label>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          value={founder.yearsExperience || 0}
                          onChange={(e) =>
                            updateFounder(founder.id, {
                              yearsExperience: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hours per Week</Label>
                        <Input
                          type="number"
                          min={0}
                          max={80}
                          placeholder="e.g. 40"
                          value={(founder as Record<string, unknown>).hoursPerWeek as number || ""}
                          onChange={(e) =>
                            updateFounder(founder.id, {
                              hoursPerWeek: Number(e.target.value),
                            } as Partial<Founder>)
                          }
                        />
                        {((founder as Record<string, unknown>).hoursPerWeek as number || 0) < 35 && (founder as Record<string, unknown>).hoursPerWeek !== undefined && (founder as Record<string, unknown>).hoursPerWeek !== "" && (
                          <p className="text-xs text-destructive">
                            ⚠ Less than 35 hrs/wk — investors expect full-time (40+)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Relevant Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Machine Learning, Sales, Product Design..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill(founder.id);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSkill(founder.id)}
                        >
                          Add
                        </Button>
                      </div>
                      {(founder.relevantSkills || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(founder.relevantSkills || []).map((skill, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="cursor-pointer hover:bg-destructive/10"
                              onClick={() => removeSkill(founder.id, i)}
                            >
                              {skill} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Prior Contributions */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Prior Contributions
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          What has this founder already done for the company?
                          Execution-based work (building, revenue, capital) is
                          valued 5–7× higher than ideas alone.
                        </p>
                      </div>

                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label>Contribution Type</Label>
                          <Select
                            value={contribForm.type}
                            onValueChange={(v) =>
                              setContribForm({
                                ...contribForm,
                                type: v as ContributionType,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTRIBUTION_TYPES.map((ct) => (
                                <SelectItem key={ct.value} value={ct.value}>
                                  {ct.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {CONTRIBUTION_TYPES.find(
                              (ct) => ct.value === contribForm.type
                            )?.description}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="What did you do? Be specific."
                            value={contribForm.description}
                            onChange={(e) =>
                              setContribForm({
                                ...contribForm,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Estimated Value ($)</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={contribForm.estimatedValue || ""}
                              onChange={(e) =>
                                setContribForm({
                                  ...contribForm,
                                  estimatedValue: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hours Invested</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={contribForm.hoursInvested || ""}
                              onChange={(e) =>
                                setContribForm({
                                  ...contribForm,
                                  hoursInvested: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => addContribution(founder.id)}
                          disabled={!contribForm.description}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contribution
                        </Button>
                      </div>

                      {(founder.contributions || []).length > 0 && (
                        <div className="space-y-2">
                          {(founder.contributions || []).map((c) => (
                            <div
                              key={c.id}
                              className="flex items-start justify-between p-3 bg-card rounded-lg border"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {CONTRIBUTION_TYPES.find(
                                      (ct) => ct.value === c.type
                                    )?.label || c.type}
                                  </Badge>
                                  <span className="text-xs font-mono text-muted-foreground">
                                    Score: {contributionToValue(c).toFixed(1)}
                                  </span>
                                </div>
                                <p className="text-sm">{c.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.hoursInvested}h invested
                                  {c.estimatedValue > 0 &&
                                    ` • $${c.estimatedValue.toLocaleString()} value`}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeContribution(founder.id, c.id)
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {founders.length >= 2 && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Define KPIs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {founders.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">
          Add at least one more founder to proceed.
        </p>
      )}
    </div>
  );
}
