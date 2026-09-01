# Vendored Lichess chess-openings dataset

Drop the five TSV files from
<https://github.com/lichess-org/chess-openings> here:

```
a.tsv  b.tsv  c.tsv  d.tsv  e.tsv
```

Grab them from the `master` branch (raw):
`https://raw.githubusercontent.com/lichess-org/chess-openings/master/a.tsv` … `e.tsv`.

They are public domain (CC0) and small (~500 KB total). Commit them alongside
this README so the opening book is reproducible offline.

Then regenerate the lookup asset:

```
pnpm openings:generate
```

which normalizes every row's PGN to SAN via `chess.js` and writes
`src/lib/chess/openings/openings-book.json` (also committed).

The backend (`chess-backend`) keeps a byte-for-byte copy of this generator and an
identically-shaped book — see that repo's `scripts/generate-openings-book.mjs`.
