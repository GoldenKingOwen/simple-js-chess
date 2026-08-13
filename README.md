# Chess Arena

A full-stack-ready chess frontend built with Next.js (App Router), TypeScript
and Tailwind CSS. Play against a friend on one screen, the bot, or online —
with a live dashboard, games archive, replays, leaderboard, profiles,
friends and notifications.

It ships against a **local mock layer** out of the box, and every service call
is wired to a documented REST + Socket.IO contract for a future NestJS backend.
Nothing is hardcoded to mocks — flip the env vars below and the same UI talks
to the real API.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Base UI primitives), `next-themes`
- **State**: Zustand (auth, settings, UI), TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Chess engine**: chess.js wrapped in a typed `ChessEngine` facade
- **Testing**: Vitest + Testing Library (jsdom)
- **Package manager**: pnpm

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Useful commands:

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start the dev server                 |
| `pnpm build`       | Production build                     |
| `pnpm start`       | Serve the production build           |
| `pnpm typecheck`   | Run `tsc --noEmit`                   |
| `pnpm lint`        | Run ESLint                           |
| `pnpm test`        | Run Vitest (headless)                |
| `pnpm test:watch`  | Run Vitest in watch mode             |

## Configuration

All environment access is centralized in [`src/config/env.ts`](src/config/env.ts).

| Variable                    | Default  | Purpose                                   |
| --------------------------- | -------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | —        | Base URL of the REST API (e.g. `https://api.example.com`) |
| `NEXT_PUBLIC_SOCKET_URL`    | falls back to `NEXT_PUBLIC_API_URL` | Base URL of the Socket.IO gateway |
| `NEXT_PUBLIC_SOCKET_PATH`   | `/socket.io` | Socket.IO path                        |
| `NEXT_PUBLIC_USE_MOCK_API`  | `"true"` when no API URL is set | Force the mock layer |

**Mock mode** is on whenever `NEXT_PUBLIC_USE_MOCK_API === "true"` **or** no
API URL is configured. In mock mode:

- Every service resolves to a `src/services/mock/*` implementation (in-memory
  data + latency, no network).
- Auth accepts any credentials and returns a fixed dev user
  (`Onewen111`, password `password`).
- Matchmaking instantly "finds" an opponent and creates a mock game.
- Socket events are no-ops; the UI falls back to REST and local echo.

## Project structure

```
src/
  app/               # Next.js routes (App Router)
  components/        # UI primitives + feature components
  config/            # env, time controls, board themes
  hooks/             # useChessGame, useNotifications, ...
  lib/               # api client, chess engine/bot, socket, sound, utils
  services/          # typed REST service layer + mock implementations
  stores/            # Zustand stores (auth, settings, ui, game)
  types/             # shared domain + API/socket types
docs/
  backend-contract.md      # REST + Socket.IO contract for the future backend
  frontend-architecture.md # how the frontend is organised
```

## Documentation

- [`docs/backend-contract.md`](docs/backend-contract.md) — every REST endpoint
  and socket event the frontend expects.
- [`docs/frontend-architecture.md`](docs/frontend-architecture.md) — data flow,
  store contracts, game hook, theming and the mock layer.