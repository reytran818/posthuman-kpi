# Posthuman Inc. — Founders KPI Agreement Tool

An AI-assisted web application that helps startup founders define fair and equitable KPIs (Key Performance Indicators) and converts them into enterprise value contributions for equity allocation.

## Features

- **Founder Setup** — Add founding team members and their roles
- **AI-Assisted KPI Input** — Chat with an AI assistant that suggests appropriate KPIs based on each founder's role
- **Enterprise Value Algorithm** — Transparent, multi-factor algorithm that converts KPIs to equity percentages
- **Fairness Analysis** — Automated detection of imbalanced allocations with recommendations
- **Visual Dashboard** — Pie charts, bar charts, and detailed breakdowns of equity distribution

## Algorithm

Each KPI is scored using:

```
score = weight × categoryMultiplier × difficultyMultiplier × timeDecay × scaleNorm
```

- **Weight (0–100):** Founder-defined importance
- **Category Multiplier:** Revenue (1.5×) > Fundraising (1.4×) > Product (1.3×) > Technical (1.2×) > Leadership (1.15×) > Marketing (1.1×) > Operations (1.0×) > Culture (0.9×)
- **Difficulty Multiplier:** Low (0.6×), Medium (1.0×), High (1.5×), Extreme (2.2×)
- **Time Decay:** 0.85^(months/12) — longer timeframes reduce annualized value
- **Scale Normalization:** log₁₀(targetValue + 1) — prevents large numbers from dominating

Equity percentage = founder's total score ÷ all founders' total scores × 100

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your AWS Bedrock credentials:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **AI:** Vercel AI SDK + Claude via Amazon Bedrock
- **Charts:** Recharts
- **Validation:** Zod
- **Deployment:** Vercel

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/posthuman-kpi&env=AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION)

Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` in your Vercel project environment variables.
