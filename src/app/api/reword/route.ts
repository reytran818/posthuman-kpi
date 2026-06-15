import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, type, founderName, role } = await req.json();

  if (!text) {
    return new Response("Text required", { status: 400 });
  }

  const prompts: Record<string, string> = {
    resume: `Rewrite this founder's resume/background to be professional, concise, and investor-ready. Keep all facts but make it sound like a top-tier startup founder bio. Remove casual language. Use third person. Keep it under 200 words.

Founder: ${founderName || "Unknown"} (${role || "Founder"})
Original text:
"${text}"

Return ONLY the rewritten text, nothing else.`,
    contribution: `Rewrite this prior contribution description to be professional, specific, and impressive to investors. Keep all facts but make it sound impactful and measurable. One clear sentence.

Founder: ${founderName || "Unknown"} (${role || "Founder"})
Original text:
"${text}"

Return ONLY the rewritten single sentence, nothing else.`,
    estimate_value: `Estimate the dollar value of this startup contribution. Consider what it would cost to hire someone or pay a contractor to do this work, or the direct business value created.

Contribution: "${text}"

Return ONLY a single number in dollars (no $ sign, no commas, no explanation). Just the number. For example: 15000`,
    extract_skills: `Extract the most relevant professional skills from this founder's resume/background. Return 8-15 skills as a simple list, one per line. Focus on concrete, specific skills that matter for a startup — not generic ones like "leadership" or "communication."

Founder: ${founderName || "Unknown"} (${role || "Founder"})
Resume:
"${text}"

Return ONLY the skills list, one skill per line. No numbers, no bullets, no explanation. Example:
Machine Learning
React / Next.js
Sales & Revenue Growth`,
  };

  const prompt = prompts[type] || prompts.contribution;

  const result = streamText({
    model: bedrock("anthropic.claude-3-5-haiku-20241022-v1:0"),
    prompt,
  });

  return result.toTextStreamResponse();
}
