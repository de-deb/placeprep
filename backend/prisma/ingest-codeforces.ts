/**
 * Codeforces catalog ingestion (metadata ONLY).
 *
 * Uses the legitimate public Codeforces API (no key, rate-limited politely)
 * to import problem *metadata*: title, rating, tags, contest+index, URL.
 * Statements and test data are NOT copied (copyright + size) — imported
 * problems are EXTERNAL: executionSupported=false, shown with
 * "Practice externally" + manual "Mark as solved" tracking.
 *
 * Run:  npm run ingest:codeforces
 * Env:  DATABASE_URL must point at the target DB. Optional CF_LIMIT (default 300).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CF_API = "https://codeforces.com/api/problemset.problems";

interface CFProblem {
  contestId?: number;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

function difficultyFor(rating: number | undefined): string {
  if (rating == null) return "Medium";
  if (rating < 1100) return "Easy";
  if (rating < 1500) return "Medium";
  return "Hard";
}

function topicsFor(tags: string[]): string[] {
  // Keep Codeforces tags readable; cap to avoid noise.
  return tags
    .map((t) =>
      t
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ")
    )
    .slice(0, 5);
}

async function main() {
  const limit = Math.min(1000, Math.max(50, Number(process.env.CF_LIMIT ?? 300)));
  console.log(`[ingest] fetching ${CF_API}`);
  const res = await fetch(CF_API);
  if (!res.ok) throw new Error(`Codeforces API responded ${res.status}`);
  const body = (await res.json()) as { status: string; result: { problems: CFProblem[] } };
  if (body.status !== "OK") throw new Error(`Codeforces API status: ${body.status}`);

  const eligible = body.result.problems.filter(
    (p) => p.type === "PROGRAMMING" && p.contestId != null && (p.rating ?? 0) >= 800 && (p.rating ?? 9999) <= 1900
  );
  // Deterministic slice: sort by contest then index so reruns are stable.
  eligible.sort((a, b) => a.contestId! - b.contestId! || (a.index < b.index ? -1 : 1));
  const batch = eligible.slice(0, limit);

  let created = 0;
  let kept = 0;
  for (const p of batch) {
    const externalId = `${p.contestId}${p.index}`;
    const existing = await prisma.codingProblem.findUnique({
      where: { source_externalId: { source: "CODEFORCES", externalId } },
    });
    if (existing) {
      kept += 1;
      continue;
    }
    await prisma.codingProblem.create({
      data: {
        title: p.name,
        difficulty: difficultyFor(p.rating),
        tags: topicsFor(p.tags),
        description: `Codeforces ${p.contestId}${p.index}${p.rating ? ` · rating ${p.rating}` : ""} — external problem. Statements and tests live on Codeforces; use “Practice externally”, then “Mark as solved” here to track it.`,
        source: "CODEFORCES",
        externalId,
        externalUrl: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        executionSupported: false,
        companies: [],
      },
    });
    created += 1;
    // Polite pacing for the public API (we only fetched once, but stay kind).
    await new Promise((r) => setTimeout(r, 5));
  }
  console.log(`[ingest] done: ${created} created, ${kept} already present (limit ${limit})`);
}

main()
  .catch((e) => {
    console.error("[ingest] failed:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
