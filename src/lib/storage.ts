const GIST_ID = "b564869cc4f48561aa9a36a61a160d2f";
const FILENAME = "posthuman-founders.json";

export async function getFounders() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
    if (res.ok) {
      const gist = await res.json();
      const content = gist.files?.[FILENAME]?.content;
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch {
    // network error or parse error
  }
  return [];
}

export async function saveFounders(founders: unknown[]) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");

  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [FILENAME]: {
          content: JSON.stringify(founders, null, 2),
        },
      },
    }),
  });
}
