/**
 * Build `src/lib/chess/openings/openings-book.json` from the vendored Lichess
 * chess-openings dataset (`scripts/chess-openings/{a..e}.tsv`).
 *
 * Each TSV row is `eco \t name \t pgn`. We replay every PGN move-by-move through
 * chess.js and key the opening by the resulting SAN move list (space-joined), so
 * the keys match exactly what the app produces from chess.js at runtime.
 *
 * No network access — the TSVs are committed to the repo (see
 * scripts/chess-openings/README.md). Re-run `pnpm openings:generate` after
 * updating them.
 *
 * NOTE: keep this logic byte-for-byte in sync with the backend copy
 * (chess-backend/scripts/generate-openings-book.mjs) except for OUT_FILE.
 */
import { Chess } from "chess.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TSV_DIR = join(HERE, "chess-openings");
const OUT_FILE = join(HERE, "..", "src", "lib", "chess", "openings", "openings-book.json");
const FILES = ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"];

const missing = FILES.filter((f) => !existsSync(join(TSV_DIR, f)));
if (missing.length) {
  console.error(
    `[openings] missing ${missing.join(", ")} in ${TSV_DIR}\n` +
      `Vendor the dataset first — see scripts/chess-openings/README.md`,
  );
  process.exit(1);
}

/** PGN movetext -> normalized SAN list, or null if it doesn't replay cleanly. */
function pgnToSan(pgn) {
  const chess = new Chess();
  const san = [];
  for (const raw of pgn.trim().split(/\s+/)) {
    const token = raw.replace(/^\d+\.(\.\.)?/, "").trim();
    if (!token || token === "*" || /^(1-0|0-1|1\/2-1\/2)$/.test(token)) continue;
    try {
      san.push(chess.move(token).san);
    } catch {
      return null;
    }
  }
  return san.length ? san : null;
}

const book = {};
let rows = 0;
let skipped = 0;

for (const file of FILES) {
  const text = readFileSync(join(TSV_DIR, file), "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const [eco, name, pgn] = line.split("\t");
    if (!eco || !name || !pgn || eco === "eco") continue; // header / malformed
    rows += 1;
    const san = pgnToSan(pgn);
    if (!san) {
      skipped += 1;
      console.warn(`[openings] skipped ${eco} "${name}" — PGN did not replay`);
      continue;
    }
    const key = san.join(" ");
    if (!book[key]) book[key] = { eco, name };
  }
}

const keys = Object.keys(book).sort();
const sorted = {};
let maxPly = 0;
for (const key of keys) {
  sorted[key] = book[key];
  const ply = key.split(" ").length;
  if (ply > maxPly) maxPly = ply;
}

const out = {
  source: "lichess-org/chess-openings",
  generatedAt: new Date().toISOString().slice(0, 10),
  count: keys.length,
  maxPly,
  book: sorted,
};

writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n");
console.log(
  `[openings] wrote ${keys.length} openings (maxPly ${maxPly}) from ${rows} rows, ${skipped} skipped -> ${OUT_FILE}`,
);
