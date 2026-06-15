import { NextResponse } from "next/server";
import { getFounders, saveFounders } from "@/lib/storage";
import type { Founder } from "@/lib/kpi-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const founders = await getFounders();
  return NextResponse.json(founders, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}

export async function PUT(req: Request) {
  const incoming: Founder[] = await req.json();
  const existing: Founder[] = await getFounders();

  if (incoming.length === 0 && existing.length > 0) {
    const confirmHeader = req.headers.get("x-confirm-reset");
    if (confirmHeader !== "true") {
      return NextResponse.json(
        { error: "Cannot overwrite existing data with empty array. Set x-confirm-reset header." },
        { status: 400 }
      );
    }
    await saveFounders([]);
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  }

  // Merge strategy: if existing has founders not in incoming (by id or name),
  // append them so additions from other sources aren't lost
  const incomingIds = new Set(incoming.map((f) => f.id));
  const incomingNames = new Set(incoming.map((f) => f.name));
  const missing = existing.filter(
    (f) => !incomingIds.has(f.id) && !incomingNames.has(f.name)
  );

  const merged = [...incoming, ...missing];

  await saveFounders(merged);
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), merged: missing.length });
}
