"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
              <li>AI: Claude Opus 4 via Amazon Bedrock (multimodal — can analyze images)</li>
              <li>Storage: Vercel Blob (shared JSON for all founders to collaborate)</li>
              <li>UI: shadcn/ui + Tailwind CSS</li>
              <li>Charts: Recharts</li>
              <li>Validation: Zod schemas</li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">How the AI is prompted:</p>
            <p className="text-muted-foreground">
              The AI receives a system prompt instructing it to act as an experienced startup advisor.
              It has access to all founder data (KPIs, contributions, skills, uploaded files) and is
              instructed to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Evaluate equity fairness against the algorithm&apos;s calculated split</li>
              <li>Challenge vague or unmeasurable KPIs</li>
              <li>Flag overlapping responsibilities</li>
              <li>Recommend evidence-based roles (not accept self-declared titles)</li>
              <li>Advise on protective legal clauses (vesting, non-compete, etc.)</li>
              <li>Discuss consequences of failure to deliver</li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium">What the AI does NOT do:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>It does not make binding legal decisions — it provides guidance only</li>
              <li>It cannot verify claims — it trusts input data and flags inconsistencies</li>
              <li>It does not replace a lawyer — all agreements should be reviewed by legal counsel</li>
              <li>It does not have memory between sessions — context is rebuilt each time from stored data</li>
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
            Exactly how equity percentages are calculated — no hidden factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="p-3 bg-muted rounded-lg font-mono text-xs space-y-2">
            <p className="font-medium text-foreground text-sm">Equity Formula:</p>
            <p>Total Score = (Future KPI Score × 70%) + (Prior Contribution Score × 30%)</p>
            <p>Equity % = (Founder Score ÷ Sum of All Founder Scores) × 85%</p>
            <p>Remaining 15% = Employee Option Pool (ESOP)</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">KPI Scoring (70% weight):</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              score = weight × categoryMultiplier × difficultyMultiplier × timeDecay × log₁₀(targetValue + 1)
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Category Multipliers:</p>
                <ul className="space-y-0.5">
                  <li>Revenue: 1.5×</li>
                  <li>Fundraising: 1.4×</li>
                  <li>Product: 1.3×</li>
                  <li>Technical: 1.2×</li>
                  <li>Leadership: 1.15×</li>
                  <li>Marketing: 1.1×</li>
                  <li>Operations: 1.0×</li>
                  <li>Culture: 0.9×</li>
                </ul>
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
                <p>0.85^(months/12) — shorter timeframes score higher</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">Prior Contribution Scoring (30% weight):</p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              score = typeWeight × log₂(hoursInvested + 1) × log₁₀(estimatedValue + 1) × 10
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Contribution Type Weights:</p>
              <ul className="space-y-0.5">
                <li>Execution (building, shipping): <strong>1.00×</strong></li>
                <li>Technical Build: <strong>0.95×</strong></li>
                <li>Revenue Generated: <strong>0.90×</strong></li>
                <li>Capital Invested: <strong>0.85×</strong></li>
                <li>IP Created: <strong>0.80×</strong></li>
                <li>Domain Expertise: <strong>0.70×</strong></li>
                <li>Team Recruited: <strong>0.65×</strong></li>
                <li>Network Connections: <strong>0.50×</strong></li>
                <li>Market Research: <strong>0.40×</strong></li>
                <li>Idea / Vision: <strong>0.30×</strong></li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium">Why 70/30 split (Future vs Past)?</p>
            <p className="text-muted-foreground">
              Startups are about what you&apos;re going to BUILD, not just what you&apos;ve done. A 70/30 split
              ensures founders are primarily judged on future commitments (which they can control going
              forward) while still crediting those who invested time, money, and effort before this agreement.
              This is adjustable — if all founders agree that past contributions should weigh more,
              the ratios can be changed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fairness Sanity Check */}
      <Card className="border-green-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-500" />
            Fairness Sanity Check
          </CardTitle>
          <CardDescription>
            Issues identified and resolved to ensure this tool is fair to all founders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Ideas ARE valued (30% of execution, not 15%)</p>
                <p className="text-muted-foreground text-xs">
                  Original design weighted ideas at only 15% (0.15×) of execution. This was
                  revised to 30% (0.30×) as unfairly dismissive. If someone&apos;s idea IS the
                  core business model or a patentable invention, it deserves meaningful credit
                  — just not as much as actually building it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Equal splits are not automatically &ldquo;bad&rdquo;</p>
                <p className="text-muted-foreground text-xs">
                  The original design flagged equal splits as a &ldquo;critical&rdquo; red flag.
                  Revised to &ldquo;warning&rdquo; — if founders genuinely contribute equally,
                  equal is the right answer. The tool asks them to explain why, rather than
                  assuming it&apos;s wrong.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Part-time is acceptable pre-investment</p>
                <p className="text-muted-foreground text-xs">
                  Original design treated part-time as always unacceptable. Revised: pre-investment,
                  part-time is understandable (people have bills). Equity should reflect reduced
                  commitment via milestone-gating. Post-investment, full-time is required by investors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">Algorithm is transparent and auditable</p>
                <p className="text-muted-foreground text-xs">
                  Every multiplier, weight, and formula is disclosed on this page. No hidden
                  factors. Any founder can verify the math by hand if they disagree with the output.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium">AI is instructed to be fair, not punitive</p>
                <p className="text-muted-foreground text-xs">
                  The AI is told to &ldquo;be firm but fair&rdquo; — it acknowledges the value of all
                  contribution types while asking founders to back claims with evidence. It does
                  not dismiss anyone; it asks for specifics.
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
                <p className="font-medium">Conflict resolution protects minority founders</p>
                <p className="text-muted-foreground text-xs">
                  Tag-along rights, binding arbitration, and the shotgun clause ensure that
                  minority founders cannot be exploited or left behind by majority holders.
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
            Known Limitations & Biases
          </CardTitle>
          <CardDescription>
            Honest disclosure of what this tool cannot do perfectly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Execution bias</p>
              <p className="text-muted-foreground text-xs">
                The algorithm inherently favors people who can point to tangible outputs. This
                may undervalue strategic thinkers, relationship builders, or founders whose value
                is harder to quantify (e.g., culture, mentorship, board management). Mitigation:
                these founders should define KPIs that capture their unique value.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Self-reported data</p>
              <p className="text-muted-foreground text-xs">
                All contributions, hours, and estimated values are self-reported. The tool cannot
                verify claims. Founders should challenge each other&apos;s inputs and provide
                evidence (uploaded documents) where possible.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Revenue/fundraising category bias</p>
              <p className="text-muted-foreground text-xs">
                The category multipliers give revenue (1.5×) and fundraising (1.4×) the highest
                weights. This reflects market reality for most startups but may not apply to
                non-profit, research, or pre-revenue deep-tech companies. Adjust expectations
                for your specific context.
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
              <p className="font-medium">Logarithmic scaling compresses extremes</p>
              <p className="text-muted-foreground text-xs">
                The use of log₁₀ for target values and log₂ for hours means that a 10× larger
                contribution does not receive 10× the score. This is intentional (to prevent one
                massive KPI from dominating) but may feel unfair to founders with outlier
                contributions. Mitigation: use multiple KPIs rather than one large one.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <Info className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <p className="font-medium">Dilution model uses typical valuations</p>
              <p className="text-muted-foreground text-xs">
                The Seed/A/B projections use representative valuations ($5M/$25M/$100M pre-money).
                Your actual dilution will depend on market conditions, traction, and negotiation.
                These are illustrative, not predictive.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fairness Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Fairness Principles This Tool Follows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { principle: "Equal treatment", detail: "Same rules, vesting, and clauses apply to all founders regardless of equity %" },
              { principle: "Evidence-based", detail: "Claims must be backed by measurable commitments or documented contributions" },
              { principle: "Transparent math", detail: "Every formula and weight is publicly disclosed and auditable" },
              { principle: "No hidden agendas", detail: "The AI has no preference for any founder — it evaluates data, not people" },
              { principle: "Minority protection", detail: "Tag-along, anti-dilution, and arbitration protect smaller shareholders" },
              { principle: "Adjustable", detail: "If all founders agree the 70/30 or type weights should change, they can" },
              { principle: "Vesting protects everyone", detail: "Prevents any single founder from taking equity and leaving immediately" },
              { principle: "Future-focused", detail: "70% weight on future KPIs means everyone can earn their way up through execution" },
            ].map((item, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <p className="font-medium text-sm">{item.principle}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Was Changed for Fairness */}
      <Card>
        <CardHeader>
          <CardTitle>Changes Made During Fairness Review</CardTitle>
          <CardDescription>
            Adjustments made to ensure no founder is unfairly disadvantaged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-2">
            {[
              { before: "Ideas weighted at 0.15× (15%)", after: "Ideas weighted at 0.30× (30%)", reason: "15% was punitively low. Ideas that form the core business model deserve meaningful credit." },
              { before: "Equal splits flagged as 'critical' red flag", after: "Equal splits flagged as 'warning' with nuance", reason: "Equal splits can be genuinely fair. The tool should ask 'why?' not assume it's wrong." },
              { before: "Part-time = 'unacceptable, take advisor equity'", after: "Part-time acceptable pre-investment with milestone-gating", reason: "People have financial obligations. Part-time pre-funding is realistic; post-funding requires full-time." },
              { before: "AI told to be 'hostile' toward ideas-only founders", after: "AI told to be 'firm but fair' — acknowledge value, ask for more", reason: "Hostility is not fairness. The AI should encourage execution without dismissing someone's contribution." },
              { before: "Capital invested weighted only at 0.85×", after: "Kept at 0.85× (validated as fair)", reason: "Capital is real commitment but money alone shouldn't equal full execution credit. 0.85× properly reflects this." },
              { before: "No disclosure of AI prompting methodology", after: "Full transparency page with complete algorithm and prompt disclosure", reason: "Founders deserve to know exactly how the tool works and what assumptions it makes." },
            ].map((change, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Before</Badge>
                  <span className="text-xs line-through text-muted-foreground">{change.before}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">After</Badge>
                  <span className="text-xs font-medium">{change.after}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30 mt-1">
                  {change.reason}
                </p>
              </div>
            ))}
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
          an objective starting point — the final agreement should reflect what ALL founders agree is fair.
        </p>
      </div>
    </div>
  );
}
