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
  await saveFounders(founders);
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
