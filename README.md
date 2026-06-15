# Posthuman Inc. — Founders KPI & Equity Agreement Tool

An AI-assisted platform that helps startup founders define fair, measurable KPIs and calculate equitable equity splits. Built to be **transparent, auditable, and deliberately unbiased**.

## Design Philosophy: No Algorithmic Bias

This tool was intentionally designed to treat all types of work equally:

- **All KPI categories weighted equally (1.0×)** — revenue, technical, marketing, operations, leadership, product, fundraising, and culture are scored identically. The algorithm does not have an opinion on which work is "more valuable."
- **No hours penalty** — founders are judged by what they commit to deliver, not how many hours they spend.
- **No experience multiplier** — years of experience don't automatically earn more equity. What matters is measurable output.
- **No mission-alignment bonus** — no specific skills are scored higher than others.
- **No contribution type hierarchy** — code, deals, hiring, research, and operations all weight the same (1.0×), except ideas alone (0.3×).

The tool presents numbers neutrally. The team decides what's fair.

## Features

- **Founder Setup** — Define founding team members, roles, skills, and experience
- **AI-Assisted KPI Input** — Describe what you'll deliver; AI generates measurable targets with hard numbers
- **Neutral Equity Algorithm** — Transparent formula that converts KPIs to equity percentages without category bias
- **Investor Overview** — Executive summary, professional cap table, and PDF export for investor presentations
- **AI Investability Assessment** — Simulates a YC partner evaluating the company's investment readiness
- **Vague KPI Detection** — AI flags unmeasurable or weak KPIs and suggests fixes
- **Recommendations** — Actionable guidance for founders and the company
- **Audit (Sanity Check)** — Automated validation of equity fairness, KPI quality, and team balance
- **Accountability Framework** — Vesting, milestone tracking, good/bad leaver scenarios
- **Full Transparency Disclosure** — Every formula, weight, and design decision publicly documented

## Algorithm

```
founderScore = (KPI Score × 70%) + (Contribution Score × 30%)) × Skills Multiplier
Equity % = (Founder Score ÷ Sum of All Scores) × 90%
Remaining 10% = Employee Option Pool (ESOP)
```

**KPI Scoring:**
```
score = weight × difficultyMultiplier × timeDecay × log₁₀(targetValue + 1)
```

- **Weight (0–100):** Founder-defined importance
- **Difficulty:** Low (0.6×), Medium (1.0×), High (1.5×), Extreme (2.2×)
- **Time Decay:** 0.85^(months/12) — shorter timeframes score higher
- **Scale:** log₁₀(targetValue + 1) — prevents large numbers from dominating

**Contribution Scoring:**
```
score = Σ(log₂(hours + 1) × log₁₀(value + 1) × 10)
```

**Skills Multiplier:** 1 + min(count, 15) × 0.01 — max 1.15× (minimal credibility signal)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
   Required environment variables:
   - `AWS_ACCESS_KEY_ID` — for Amazon Bedrock (Claude Opus 4)
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `GITHUB_TOKEN` — for Gist-based data persistence

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** Claude Opus 4 via Amazon Bedrock (all endpoints)
- **UI:** shadcn/ui + Tailwind CSS
- **Storage:** GitHub Gist (shared JSON collaboration)
- **Charts:** Recharts
- **Validation:** Zod
- **Deployment:** Vercel

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/reytran818/posthuman-kpi&env=AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION,GITHUB_TOKEN)

Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `GITHUB_TOKEN` in your Vercel project environment variables.

## License

Private — Posthuman Inc. internal use.
