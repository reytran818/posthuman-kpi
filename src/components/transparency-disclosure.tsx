"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Info,
  BookOpen,
} from "lucide-react";

export function TransparencyDisclosure() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Transparency & Disclosure
        </h2>
        <p className="text-muted-foreground mt-1">
          Full disclosure of how this tool works, what assumptions it makes, and
          how fairness was validated.
        </p>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            How This Tool Was Built
          </CardTitle>
          <CardDescription>
            Complete disclosure of methodology, AI prompting, and design decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Technology Stack:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Next.js 15 (App Router) deployed on Vercel</li>
              <li>AI: Claude Opus 4 via Amazon Bedrock (all endpoints)</li>
              <li>Storage: GitHub Gist (shared JSON for all founders to collaborate)</li>
              <li>UI: shadcn/ui + Tailwind CSS</li>
              <li>Charts: Recharts</li>
              <li>Validation: Zod schemas</li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">How the AI is prompted:</p>
            <p className="text-muted-foreground">
              The AI receives a system prompt instructing it to act as a neutral startup advisor.
              It has access to all founder data (KPIs, contributions, skills) and is instructed to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Evaluate equity fairness by comparing requested vs. calculated</li>
              <li>Challenge vague or unmeasurable KPIs — demand hard numbers</li>
              <li>Flag overlapping responsibilities</li>
              <li>Present facts neutrally — do NOT favor any type of work over another</li>
              <li>Never tell a founder their work type is &quot;less valuable&quot;</li>
              <li>Discuss consequences of failure to deliver</li>
              <li>Provide investability assessment when asked</li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">What the AI does NOT do:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>It does not make binding legal decisions — it provides guidance only</li>
              <li>It cannot verify claims — it trusts input data and flags inconsistencies</li>
              <li>It does not replace a lawyer — all agreements should be reviewed by legal counsel</li>
              <li>It does not have memory between sessions — context is rebuilt each time</li>
              <li>It does not favor any category of work (revenue, technical, etc.) over another</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Disclosure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Algorithm: Full Disclosure
          </CardTitle>
          <CardDescription>
            Exactly how equity percentages are calculated — no hidden factors, no bias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-2">
            <p className="font-medium text-foreground text-sm">Equity Formula:</p>
            <p>founderScore = (KPI Score × 70%) + (Contribution Score × 30%)) × Skills Multiplier</p>
            <p>Equity % = (Founder Score ÷ Sum of All Scores) × 90%</p>
            <p>Remaining 10% = Employee Option Pool (ESOP)</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">KPI Scoring (70% weight):</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              score = weight × difficultyMultiplier × timeDecay × log₁₀(targetValue + 1)
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Category Multipliers:</p>
                <ul className="space-y-0.5">
                  <li>Revenue: <strong>1.0×</strong></li>
                  <li>Fundraising: <strong>1.0×</strong></li>
                  <li>Leadership: <strong>1.0×</strong></li>
                  <li>Marketing: <strong>1.0×</strong></li>
                  <li>Product: <strong>1.0×</strong></li>
                  <li>Operations: <strong>1.0×</strong></li>
                  <li>Technical: <strong>1.0×</strong></li>
                  <li>Culture: <strong>1.0×</strong></li>
                </ul>
                <p className="mt-2 text-foreground font-medium">All categories are weighted equally. No type of work is valued more than another.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Difficulty Multipliers:</p>
                <ul className="space-y-0.5">
                  <li>Low: 0.6×</li>
                  <li>Medium: 1.0×</li>
                  <li>High: 1.5×</li>
                  <li>Extreme: 2.2×</li>
                </ul>
                <p className="font-medium text-foreground mb-1 mt-2">Time Decay:</p>
                <p>0.85^(months/12) — shorter timeframes score higher because urgency creates more value</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">Prior Contribution Scoring (30% weight):</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-1">
              <p>contributionValue = Σ(log₂(hours + 1) × log₁₀(value + 1) × 10)</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Contribution Type Weights:</p>
              <ul className="space-y-0.5">
                <li>Revenue Generated: <strong>1.0×</strong></li>
                <li>Execution: <strong>1.0×</strong></li>
                <li>Capital Invested: <strong>1.0×</strong></li>
                <li>Team Recruited: <strong>1.0×</strong></li>
                <li>Network Connections: <strong>1.0×</strong></li>
                <li>Domain Expertise: <strong>1.0×</strong></li>
                <li>IP Created: <strong>1.0×</strong></li>
                <li>Technical Build: <strong>1.0×</strong></li>
                <li>Market Research: <strong>1.0×</strong></li>
                <li>Idea / Vision: <strong>0.3×</strong> — ideas without execution are still less valuable than doing the work</li>
              </ul>
              <p className="mt-2 font-medium text-foreground">All contribution types (except ideas alone) are weighted equally. No experience multiplier is applied.</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">Skills Multiplier:</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              <p>skillsMultiplier = 1 + min(skillCount, 15) × 0.01 → max 1.15×</p>
            </div>
            <p className="text-xs text-muted-foreground">
              A minimal credibility signal. Having documented skills gives a small boost (max 15%)
              but is not a major factor in equity calculation. No mission-specific bonuses.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">What is NOT in the algorithm:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
              <li><strong>No hours adjustment</strong> — founders are judged by what they commit to deliver, not hours spent</li>
              <li><strong>No experience multiplier</strong> — years of experience don&apos;t automatically earn more equity</li>
              <li><strong>No category bias</strong> — technical, revenue, marketing, etc. are all equal</li>
              <li><strong>No mission-alignment bonus</strong> — no specific skills are weighted more than others</li>
              <li><strong>No contribution type hierarchy</strong> — code, deals, hiring, research all weight the same</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">Why 70/30 split (Future vs Past)?</p>
            <p className="text-muted-foreground">
              Startups are about what you&apos;re going to BUILD, not just what you&apos;ve done. A 70/30 split
              ensures founders are primarily judged on future commitments (which they can control going
              forward) while still crediting those who invested time, money, and effort before this agreement.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fairness Principles */}
      <Card className="border-green-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-500" />
            Fairness Principles
          </CardTitle>
          <CardDescription>
            How this tool ensures no founder is unfairly advantaged or disadvantaged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">All work types valued equally</p>
                <p className="text-muted-foreground text-xs">
                  Technical work, revenue work, marketing, operations, leadership — all score at 1.0×.
                  The tool does not have an opinion on which type of work is &quot;more valuable.&quot;
                  That&apos;s for the team to discuss.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">No penalty for part-time (pre-investment)</p>
                <p className="text-muted-foreground text-xs">
                  The algorithm does not discount your score based on hours. If you commit to deliver
                  specific KPIs, you&apos;re scored on those commitments regardless of how many hours you
                  work. Post-investment, investors will require full-time — but that&apos;s their decision.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">No experience advantage</p>
                <p className="text-muted-foreground text-xs">
                  A founder with 20 years of experience and a founder with 0 years are scored identically
                  if they commit to the same KPIs. Experience is shown for context but does not
                  algorithmically boost anyone&apos;s equity calculation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Transparent and auditable</p>
                <p className="text-muted-foreground text-xs">
                  Every formula is disclosed on this page. Any founder can verify the math:
                  score = weight × difficulty × timeDecay × log(target). No hidden factors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Protective clauses apply equally to ALL founders</p>
                <p className="text-muted-foreground text-xs">
                  Vesting, non-compete, IP assignment, ROFR — all apply identically to every
                  founder regardless of equity percentage or role. No one has special exemptions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">The tool presents numbers — the team decides</p>
                <p className="text-muted-foreground text-xs">
                  The algorithm provides an objective starting point based on the KPIs each founder sets.
                  It does not tell anyone what they &quot;should&quot; accept. The final agreement
                  should reflect what ALL founders negotiate and agree is fair.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Known Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Known Limitations
          </CardTitle>
          <CardDescription>
            Honest disclosure of what this tool cannot do perfectly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Self-reported data</p>
              <p className="text-muted-foreground text-xs">
                All contributions, hours, and estimated values are self-reported. The tool cannot
                verify claims. Founders should challenge each other&apos;s inputs and provide
                evidence where possible.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">KPI weight is subjective</p>
              <p className="text-muted-foreground text-xs">
                Each founder sets their own KPI weights (0-100). Someone who sets all weights to 90+
                will score higher than someone who sets moderate weights of 50-60, even if both are
                contributing equally. The team should review and agree on relative weights.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Logarithmic scaling compresses extremes</p>
              <p className="text-muted-foreground text-xs">
                The use of log₁₀ for target values means that a 10× larger target does not get
                10× the score. This prevents one massive KPI from dominating but may feel unfair
                to founders with outlier contributions. Mitigation: use multiple KPIs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Not legal advice</p>
              <p className="text-muted-foreground text-xs">
                This tool provides a structured framework for discussion. It is NOT a substitute
                for legal counsel. All equity agreements, vesting schedules, and protective clauses
                should be reviewed and formalized by a qualified startup attorney.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">AI can make mistakes</p>
              <p className="text-muted-foreground text-xs">
                Claude Opus 4 provides analysis and suggestions but is not infallible. Always review
                AI-generated content critically. The algorithmic calculation is deterministic and
                verifiable; the AI commentary is advisory only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground text-center">
        <p className="font-medium text-foreground mb-1">
          This tool is a framework, not a verdict.
        </p>
        <p>
          All founders should review the output together, discuss disagreements openly, and consult
          a qualified startup attorney before signing any binding agreement. The algorithm provides
          a neutral starting point — the final agreement should reflect what ALL founders agree is fair.
        </p>
      </div>
    </div>
  );
}
