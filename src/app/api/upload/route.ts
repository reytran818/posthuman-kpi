import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const founderId = formData.get("founderId") as string;

  if (!file || !founderId) {
    return NextResponse.json({ error: "Missing file or founderId" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and image files (PNG, JPG, WebP, GIF) are allowed" },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum 10MB." },
      { status: 400 }
    );
  }

  const filename = `founders/${founderId}/${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({
    url: blob.url,
    filename: file.name,
    type: file.type,
    size: file.size,
  });
}
