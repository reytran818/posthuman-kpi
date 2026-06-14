import { NextResponse } from "next/server";
import { getFounders, saveFounders } from "@/lib/storage";
import type { Founder } from "@/lib/kpi-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const founders = await getFounders();
  return NextResponse.json(founders);
}

export async function PUT(req: Request) {
  const founders: Founder[] = await req.json();

  // Protect against accidental data wipes — don't overwrite
  // existing data with empty array unless explicitly intended
  if (founders.length === 0) {
    const existing = await getFounders();
    if (existing.length > 0) {
      const confirmHeader = req.headers.get("x-confirm-reset");
      if (confirmHeader !== "true") {
        return NextResponse.json(
          { error: "Cannot overwrite existing data with empty array. Set x-confirm-reset header." },
          { status: 400 }
        );
      }
    }
  }

  await saveFounders(founders);
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
