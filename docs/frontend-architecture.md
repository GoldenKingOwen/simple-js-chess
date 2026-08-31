# Frontend architecture

How the Next.js frontend is organised and how data flows through it.

## Routes

```
/                     → redirects to /dashboard
/play                 → hub (quick play, play the bot, local game, create private game)
/play/local           → local two-player setup + game (same board)
/play/bot             → bot game setup; starts a persisted server-side GameMode.BOT
                        game (real Stockfish) at /game/[gameId], or — with "Practice
                        mode" on — an offline client-bot game

/play/online          → online lobby: quick matchmaking, create, join tabs
/game/[gameId]        → live online game screen (socket + REST fallback)
/login /register /forgot-password
/dashboard            → stats, quick actions, recent games, friends, notifications
/games                → game archive (all / wins / losses / draws)
/games/[gameId]       → move-by-move replay
/leaderboard          → rankings with filter + period tabs
/profile/[username]   → public profile + rating chart
/friends              → friends, requests, search
/notifications        → notification inbox
/settings/{account,appearance,game,privacy}
```

## Data layer

Three boundaries keep the UI decoupled from where data actually comes from:

1. **Services** (`src/services/*.ts`) — one module per domain. Export an
   interface and a `real*` implementation (REST via the `ApiClient`), then pick
   `USE_MOCK_API ? mockX : realX`. The mock implementations
   (`src/services/mock/`) supply in-memory data with simulated latency, so the
   whole app runs with zero backend.
2. **HTTP client** (`src/lib/api/client.ts`) — the only place `fetch` is used.
   Handles the base URL, `Authorization` header (via `setTokenProvider`),
   JSON, timeouts, and normalizes NestJS-style errors to `ApiError`.
3. **Socket client** (`src/lib/socket/socket-client.ts`) — a lazy singleton.
   The first `onSocket` subscription triggers a connection; `disconnectSocket`
   tears it down. When no gateway URL is configured it is a no-op, letting the
   game screen degrade to REST + local chat echo.

**Server-state** in pages is fetched with TanStack Query
(React Query provider in `src/components/app/providers.tsx`); mutations
invalidate their keys so lists stay in sync.

## Stores (Zustand)

- `auth-store` — `user`, `token`, `setAuthenticated`, `logout`. Persisted
  under `chess-auth`; on boot it wires `setTokenProvider` + `setSocketAuth`.
- `settings-store` — board theme, piece style, theme mode, game options
  (legal moves, highlight, coordinates, sound levels, voice…) and privacy
  options. Persisted under `chess-settings`.
- `ui-store` — connection status, mobile menu, sound toggling helpers.
- `game-store` — `STARTING_FEN`, `GamePlayerSlot`, `ResolvedMove` types and
  per-format default ratings; pure constants, no state.

## Chess engine & the game hook

`src/lib/chess/chess-engine.ts` wraps chess.js with a typed facade
(`fen`, `turn`, `move`, `movesBySquare`, `isCheck`, `isGameOver`, `result`,
`moveFromSan`, `history`, `reset`). `board-utils.ts` maps engine output to the
board renderer; `bot.ts` provides `LocalChessBot(difficulty, color)` which
returns a SAN via `getMove(fen)` with `botThinkDelay`.

`useChessGame` (`src/hooks/use-chess-game.ts`) is the engine of **local games and
the offline "practice" bot** (a real `GameMode.BOT` game runs server-side through
the online game screen — see Routes). It owns:

- the engine **instance** (stable `useState`, never swapped),
- **moves / fen / turn / lastMove / check** sync,
- per-side **clocks** with a `250ms` interval (side to move ticks down,
  timeout ends the game via `result { winner, outcome: "timeout" }`),
- **flags**: resignation, draw offer/accept/decline, takeback, new game,
- the **bot reply loop**: after a human move it schedules
  `botThinkDelay` → `getMove` → `applyMove` (recursive, via a hoisted
  `function` so the bot can reply to itself in analysis).

React-hooks v6 lint rules (`refs`, `set-state-in-effect`, `purity`) shaped this
source: `engine`/`turn`-derived clocks avoid render-phase ref reads, latest
props live in refs synced by a dependency-free `useEffect`, and `.then`
callbacks (not effect bodies) drive `setState`.

## Game screen & components

`components/game/game-screen.tsx` composes the board, player panels, clocks,
move list, PGN, chat, notes, promotion dialog, game-over/result dialogs, and
controls (`game-controls.tsx`). It is a **controlled** component — the parent
hands it `fen`, `moves`, clocks, callbacks (`onMove`, `onResign`, …) and an
`interaction` mode (`play | white-only | black-only | spectator`).

- **Local** and **practice-bot** pages drive it from `useChessGame`.
- **Online** (`game/[gameId]/online-game-client.tsx`) drives it from the
  socket/REST game state; the backend is authoritative and only client-side
  cosmetics (clocks, banners) are adjusted locally.

The board renderer (`components/chess/`) is theme/piece-style aware:
`BusyBoard` colors come from the settings store, `PieceStyleButton` picks the
CSF/piece set, and game options (legal-move dots, last-move highlight,
coordinates, auto-queen, animations) are read from `settings-store`.

## Theming

Bootstrapped in `app/providers.tsx` with `next-themes`
(`attribute="class"`, `storageKey="chess-theme"`, default dark).
`ThemeBridge` keeps the settings store's `themeMode` and next-themes in sync,
so the appearance page only calls `setThemeMode`.

## Mock timeline for online play

1. `/play/online` → `gameService.startMatchmaking` returns a `"searching"`
   ticket; `mock-games` waits ~1.6s, creates `mock-match-*`, returns `"found"`.
2. `MatchmakingScreen` shows the opponent + countdown, then `router.push`.
3. `/game/[gameId]` loads via REST, seeds local chat, and subscribes to socket
   events (no-ops in mock mode). Moves POST through the mock `gameService`,
   which returns the updated authoritative game.

## Testing

Vitest + Testing Library run under jsdom (`vitest.config.ts`). Tests cover the
chess facade/bot (`src/lib/chess`), the game hook and clock behaviour,
validation schemas, and settings/board components. Run with `pnpm test`.