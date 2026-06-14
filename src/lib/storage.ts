import { put, list } from "@vercel/blob";

const BLOB_FILENAME = "posthuman-founders.json";
const STORE_ID = "store_Hvu3tBACEtcsYRzU";

export async function getFounders() {
  try {
    const { blobs } = await list({
      prefix: BLOB_FILENAME,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      return await res.json();
    }
  } catch {
    // blob doesn't exist yet or store not configured
  }
  return [];
}

export async function saveFounders(founders: unknown[]) {
  await put(BLOB_FILENAME, JSON.stringify(founders), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
