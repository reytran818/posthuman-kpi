import { streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, type, founderName, role } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
    };

    const prompt = prompts[type] || prompts.contribution;

    const result = streamText({
      model: bedrock("anthropic.claude-opus-4-20250514-v1:0"),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
