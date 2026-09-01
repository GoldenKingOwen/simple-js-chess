# Backend Contract

Contract the frontend expects from the future NestJS backend.

- Base URL: value of `NEXT_PUBLIC_API_URL`.
- All requests send `Authorization: Bearer <token>` (token from the auth store).
- Successful responses use a NestJS-like envelope: `{ data: T, meta? }`.
- Errors use: `{ statusCode, message, error, details }`. The client throws
  `ApiError` with `.message`, `.status`, `.details` (see `src/lib/api/client.ts`).
- The backend is **authoritative**: the client never trusts or mutates game
  state locally for online games; it re-renders from `gameState`/`moveMade`.

## Conventions

- JSON in/out everywhere.
- IDs: opaque strings (the client treats them as `string`).
- Time controls: ids `bullet | blitz | rapid | classical | casual`.
- Colors: `"w" | "b"`.
- Moves use squares like `"e2"`/`"e4"` and optional promotion in `"q"|"r"|"b"|"n"`.

## REST endpoints

### Auth — `src/services/auth-service.ts`

| Method | Path                    | Body / query                              | Returns        |
| ------ | ----------------------- | ----------------------------------------- | -------------- |
| POST   | `/auth/login`           | `{ usernameOrEmail, password, rememberMe? }` | `AuthUser`   |
| POST   | `/auth/register`        | `{ username, email, password }`           | `AuthUser`     |
| GET    | `/auth/me`              | —                                         | `User`         |
| POST   | `/auth/logout`          | —                                         | —              |
| POST   | `/auth/forgot-password` | `{ email }`                               | —              |
| POST   | `/auth/reset-password`  | `{ token, password }`                     | —              |

`AuthUser = { user: User, token: string, expiresAt: string }`.

### Users / profile — `src/services/profile-service.ts`

| Method | Path                    | Body                       | Returns               |
| ------ | ----------------------- | -------------------------- | --------------------- |
| GET    | `/users/:username`      | —                          | `Profile`             |
| GET    | `/users/me`             | —                          | `User`                |
| PATCH  | `/users/me`             | `UpdateProfileInput`       | `User`                |
| POST   | `/users/me/password`    | `{ currentPassword, newPassword }` | —             |
| PATCH  | `/users/me/email`       | `{ email }`                | —                     |
| GET    | `/users/:username/ratings` | —                       | `RatingPoint[]`       |

`Profile` extends `User` with per-format rating stats, win/loss/draw records,
current streak and recent matches.

### Games — `src/services/game-service.ts`

| Method | Path                        | Body / query                            | Returns             |
| ------ | --------------------------- | --------------------------------------- | ------------------- |
| POST   | `/games`                    | `CreateGameInput`                       | `Game`              |
| POST   | `/games/:id/join`           | `{ password? }`                         | `Game`              |
| GET    | `/games/:id`                | —                                       | `Game`              |
| POST   | `/games/:id/moves`          | `{ from, to, promotion? }`              | `Game`              |
| POST   | `/games/:id/resign`         | —                                       | `Game`              |
| POST   | `/games/:id/draw`           | —                                       | `Game`              |
| PUT    | `/games/:id/draw`           | `{ accept: boolean }`                   | `Game`              |
| GET    | `/games`                    | `?userId=`                              | `Game[]`            |
| GET    | `/games/:id/moves`          | —                                       | `Move[]`            |
| POST   | `/matchmaking`              | `{ timeControlId, rated }`              | `MatchmakingTicket` |
| DELETE | `/matchmaking/:ticketId`    | —                                       | —                   |

`CreateGameInput = { mode, timeControlId, rated, colorPreference? }`.

`MatchmakingTicket = { id?, status: "searching"|"found", timeControlId, rated, match? }`
where `match = { gameId, opponent, color, countdownMs }`.

### Friends — `src/services/friend-service.ts`

| Method | Path                          | Body / query      | Returns            |
| ------ | ----------------------------- | ----------------- | ------------------ |
| GET    | `/friends`                    | —                 | `Friend[]`         |
| GET    | `/friends/requests/pending`   | —                 | `FriendRequest[]`  |
| GET    | `/friends/requests/sent`      | —                 | `FriendRequest[]`  |
| GET    | `/users/search`               | `?q=`             | `User[]`           |
| POST   | `/friends/:userId`            | —                 | —                  |
| PUT    | `/friends/requests/:id`       | `{ accept }`      | —                  |
| DELETE | `/friends/:userId`            | —                 | —                  |

### Leaderboard — `src/services/leaderboard-service.ts`

| Method | Path            | Body / query                       | Returns            |
| ------ | --------------- | ---------------------------------- | ------------------ |
| GET    | `/leaderboard`  | `?filter=&period=`                 | `LeaderboardPage`  |

`filter ∈ global | friends`, `period ∈ all | month | week | today`.

### Notifications — `src/services/notification-service.ts`

| Method | Path                        | Body / query       | Returns                |
| ------ | --------------------------- | ------------------ | ---------------------- |
| GET    | `/notifications`            | `?cursor=`         | `NotificationPage`     |
| GET    | `/notifications/unread-count` | —               | `number`               |
| POST   | `/notifications/read`       | `{ ids? }` (omit to mark all) | — |

## Socket.IO gateway

Typed in `src/types/socket.ts`; names must stay in sync.

### Client → server

| Event             | Payload                                     |
| ----------------- | ------------------------------------------- |
| `authenticate`    | `{ token }`                                 |
| `joinGame`        | `{ gameId, password? }`                     |
| `leaveGame`       | `{ gameId }`                                |
| `makeMove`        | `{ gameId, from, to, promotion? }`          |
| `resignGame`      | `{ gameId }`                                |
| `offerDraw`       | `{ gameId }`                                |
| `acceptDraw`      | `{ gameId }`                                |
| `declineDraw`     | `{ gameId }`                                |
| `sendChatMessage` | `{ gameId, body }`                          |
| `requestRematch`  | `{ gameId }`                                |
| `startMatchmaking`| `{ timeControlId, rated }`                  |
| `cancelMatchmaking`| —                                          |
| `sendFriendRequest`| `{ userId }`                               |
| `respondFriendRequest`| `{ requestId, accept }`                 |
| `sendChallenge`   | `{ userId, timeControlId, rated }`          |
| `subscribeMatchmaking` / `unsubscribeMatchmaking` | — |

### Server → client

| Event                 | Payload                                   |
| --------------------- | ----------------------------------------- |
| `gameState`           | `Game` (full authoritative state)         |
| `moveMade`            | `{ game, move }`                          |
| `openingRecognized`   | `{ gameId, eco, name, matchedPly }` — emitted only when the matched ECO opening changes (ONLINE/BOT); never cleared once matched |
| `gameEnded`           | `{ gameId, result, game }`                |
| `playerJoined`        | `{ gameId, userId, username }`            |
| `playerDisconnected`  | `{ gameId, userId }`                      |
| `playerReconnected`   | `{ gameId, userId }`                      |
| `drawOffered`         | `{ gameId, byUserId }`                    |
| `drawResolved`        | `{ gameId, accepted }`                    |
| `chatMessage`         | `ChatMessage`                             |
| `clockTick`           | `{ gameId, whiteMs, blackMs, turn }`      |
| `matchmaking`         | `{ status, ticketId, queueSize }`         |
| `matchFound`          | `{ ticketId, gameId, opponent, color, countdownMs, timeControlId, rated }` |
| `ping`                | —                                         |
| `event`               | `{ type, message, data? }`                |

### `Game` shape (authoritative)

```ts
{
  id,             // string
  mode,           // "online"
  status,         // "active" | "paused" | "ended"
  rated,          // boolean
  timeControl,    // { id, label, timeMs, incrementMs }
  position,       // FEN string
  moveHistory,    // Move[]
  white,          // GamePlayer { user, color:"w", rating, clockMs, disconnected }
  black,          // GamePlayer (same shape, color:"b")
  currentPlayerColor, // "w" | "b"
  drawOfferBy,    // userId | null
  result,         // GameResult | null
  opening,        // { eco, name, ply } | null — persisted best-known ECO opening
  pgn,            // string
}
```

`Move = { color, from, to, piece?, captured?, promotion?, flags, uci, san, fen, check?, checkmate? }`.

`GameResult = { winner: "w" | "b" | null, outcome: "checkmate" | "stalemate" | "timeout" | "resignation" | "agreement" | "insufficient-material" | "fifty-move" | "repetition" }`.