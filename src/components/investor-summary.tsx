"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Founder } from "@/lib/kpi-engine";
import {
  calculateEquitySplit,
  projectedEnterpriseValue,
  investorReadinessCheck,
  assignRoles,
  EMPLOYEE_OPTION_POOL,
} from "@/lib/kpi-engine";
import {
  Building2,
  Users,
  TrendingUp,
  PieChart,
  Clock,
  FileText,
  Download,
} from "lucide-react";

interface InvestorSummaryProps {
  founders: Founder[];
}

export function InvestorSummary({ founders }: InvestorSummaryProps) {
  const equitySplit = calculateEquitySplit(founders);
  const enterpriseValue = projectedEnterpriseValue(founders);
  const investorCheck = investorReadinessCheck(founders);
  const roleAssignments = assignRoles(founders);

  const totalCommitted = founders.reduce((s, f) => s + (f.hoursPerWeek || 0), 0);
  const fullTimeCount = founders.filter((f) => (f.hoursPerWeek || 0) >= 35).length;
  const totalKPIs = founders.reduce((s, f) => s + f.kpis.length, 0);
  const avgExperience = founders.length > 0
    ? (founders.reduce((s, f) => s + (f.yearsExperience || 0), 0) / founders.length).toFixed(0)
    : "0";

  function exportPDF() {
    window.print();
  }

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between print:block">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Posthuman Inc.</h2>
              <p className="text-sm text-muted-foreground">Executive Summary — Founders Agreement</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mt-3">
            AI-powered smart health devices that track biometrics and help people live better.
            This document outlines the founding team&apos;s equity allocation, key performance
            indicators, and accountability framework.
          </p>
        </div>
        <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2 print:hidden">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Founding Team</p>
            <p className="text-3xl font-bold mt-1">{founders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{fullTimeCount} full-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Hours</p>
            <p className="text-3xl font-bold mt-1">{totalCommitted}</p>
            <p className="text-xs text-muted-foreground mt-1">combined hrs/wk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KPIs Defined</p>
            <p className="text-3xl font-bold mt-1">{totalKPIs}</p>
            <p className="text-xs text-muted-foreground mt-1">measurable targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investor Ready</p>
            <p className="text-3xl font-bold mt-1">{investorCheck.score}<span className="text-lg text-muted-foreground">/100</span></p>
            <p className="text-xs text-muted-foreground mt-1">readiness score</p>
          </CardContent>
        </Card>
      </div>

      {/* Cap Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-4 w-4" />
            Cap Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold">Founder</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold text-right">Equity (%)</th>
                  <th className="pb-3 font-semibold text-right">Hours/wk</th>
                  <th className="pb-3 font-semibold text-right">Experience</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {equitySplit.map((s) => {
                  const f = founders.find((x) => x.id === s.founderId);
                  const role = roleAssignments.find((r) => r.founderId === s.founderId);
                  if (!f) return null;
                  return (
                    <tr key={s.founderId} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium">{f.name}</td>
                      <td className="py-3 text-muted-foreground">{role?.recommendedRole || f.role}</td>
                      <td className="py-3 text-right font-mono font-semibold">{s.equityPercent.toFixed(1)}%</td>
                      <td className="py-3 text-right font-mono">{f.hoursPerWeek || 0}</td>
                      <td className="py-3 text-right font-mono">{f.yearsExperience || 0} yrs</td>
                      <td className="py-3 text-center">
                        <Badge variant={(f.hoursPerWeek || 0) >= 35 ? "default" : "secondary"} className="text-xs">
                          {(f.hoursPerWeek || 0) >= 35 ? "Full-time" : "Part-time"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2">
                  <td className="pt-3 font-semibold">Employee Option Pool</td>
                  <td className="pt-3 text-muted-foreground">Reserved for future hires</td>
                  <td className="pt-3 text-right font-mono font-semibold">{EMPLOYEE_OPTION_POOL}%</td>
                  <td colSpan={3}></td>
                </tr>
                <tr>
                  <td className="pt-2 font-bold">Total</td>
                  <td></td>
                  <td className="pt-2 text-right font-mono font-bold">
                    {(equitySplit.reduce((s, e) => s + e.equityPercent, 0) + EMPLOYEE_OPTION_POOL).toFixed(1)}%
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Founding Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {founders.map((f) => {
            const role = roleAssignments.find((r) => r.founderId === f.id);
            const split = equitySplit.find((s) => s.founderId === f.id);
            return (
              <div key={f.id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                  {f.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{f.name}</p>
                    <Badge variant="outline" className="text-xs">{split?.equityPercent.toFixed(1)}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{role?.recommendedRole || f.role}</p>
                  {f.resume && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.resume}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{f.hoursPerWeek || 0} hrs/wk</span>
                    <span>{f.yearsExperience || 0} yrs exp</span>
                    <span>{(f.relevantSkills || []).length} skills</span>
                    <span>{f.kpis.length} KPIs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Key Performance Indicators — Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {founders.map((f) => (
              <div key={f.id}>
                <p className="font-medium text-sm mb-2">{f.name}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {f.kpis.slice(0, 4).map((kpi) => (
                    <div key={kpi.id} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                      <Badge variant="outline" className="text-[10px] shrink-0">{kpi.category}</Badge>
                      <span className="truncate">{kpi.name}</span>
                      <span className="ml-auto font-mono shrink-0">{kpi.targetValue} {kpi.unit}</span>
                    </div>
                  ))}
                  {f.kpis.length > 4 && (
                    <p className="text-xs text-muted-foreground p-2">+{f.kpis.length - 4} more KPIs</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Governance & Protection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Governance & Protection Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Vesting</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li>4-year standard vesting with 1-year cliff</li>
                <li>Monthly vesting after cliff period</li>
                <li>Acceleration on change of control (double trigger)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Accountability</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li>Quarterly KPI review with documented evidence</li>
                <li>3-warning system before vesting pause</li>
                <li>Good leaver / bad leaver provisions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Equity Protection</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li>Milestone-based equity lock-in</li>
                <li>Anti-dilution provisions</li>
                <li>Right of first refusal on transfers</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Decision Rights</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li>Board decisions by majority vote</li>
                <li>Protective provisions for key decisions</li>
                <li>Deadlock resolution mechanism</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <div className="text-xs text-muted-foreground border-t pt-4 print:mt-8">
        <div className="flex items-center gap-4">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <p>
            Equity allocation computed algorithmically using KPI enterprise value scoring,
            weighted by category (revenue 1.6×, technical 0.9×), difficulty, hours commitment
            (√(h/40) adjustment), experience multiplier, and mission-aligned skills.
            10% employee option pool reserved. Full methodology available in Disclosure tab.
          </p>
        </div>
        <p className="mt-2 ml-7.5">
          Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} •
          Powered by Claude Opus 4 on Amazon Bedrock •
          Avg. team experience: {avgExperience} years •
          Projected enterprise score: {enterpriseValue.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
