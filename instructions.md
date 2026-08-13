You are a senior frontend engineer specializing in Next.js, React, TypeScript, chess applications, responsive UI, and real-time multiplayer interfaces.

I have an existing JavaScript chess project currently deployed on Netlify.

I want you to completely redesign/migrate the frontend into a modern, production-quality Next.js chess application.

IMPORTANT:

This task is FRONTEND ONLY.

The backend will be developed separately in another repository using NestJS.

Do NOT create a NestJS backend in this repository.

Do NOT create a database.

Do NOT implement server-side authentication.

Do NOT implement server-side chess validation.

Do NOT attempt to run WebSocket servers inside Next.js.

Instead, create clean frontend abstractions/interfaces that will connect to the future NestJS backend.

The final frontend must be deployable to Netlify.

1. Technology Stack

Use the latest stable versions available at the time of implementation.

Required:

Next.js
App Router
TypeScript
React
pnpm
Tailwind CSS
shadcn/ui where useful
Lucide React
Framer Motion where appropriate
Zustand where client-side global state is useful
TanStack Query for API/server state
React Hook Form
Zod
chess.js for client-side chess rules and move generation
socket.io-client for future real-time communication

Do not use deprecated Next.js patterns.

Use Server Components by default.

Use "use client" only where client-side interaction/state is required.

2. Frontend Architecture

The frontend must be designed as a standalone application that communicates with an external backend.

Architecture:

                     ┌──────────────────────┐
                     │      Next.js         │
                     │      Frontend        │
                     │       Netlify        │
                     └──────────┬───────────┘
                                │
                     REST / HTTPS API
                                │
                     ┌──────────▼───────────┐
                     │    Future NestJS     │
                     │       Backend        │
                     └──────────┬───────────┘
                                │
                         PostgreSQL/etc.

For real-time games:

Next.js Client
      │
      │ Socket.IO
      ▼
Future NestJS WebSocket Gateway
      │
      ├── Player A
      └── Player B

The frontend must not assume that the backend is hosted on the same domain.

3. Environment Variables

Prepare the application to use:

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=

For example:

NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SOCKET_URL=https://api.example.com

Do not hardcode production URLs.

Create:

.env.example

Do not commit .env.local.

4. Project Structure

Use a clean structure similar to:

src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   │
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── play/
│   │   ├── local/
│   │   ├── bot/
│   │   └── online/
│   │
│   ├── game/
│   │   └── [gameId]/
│   │
│   ├── games/
│   ├── leaderboard/
│   ├── profile/
│   │   └── [username]/
│   │
│   ├── friends/
│   ├── notifications/
│   │
│   └── settings/
│       ├── account/
│       ├── appearance/
│       ├── game/
│       └── privacy/
│
├── components/
│   ├── chess/
│   ├── game/
│   ├── chat/
│   ├── notes/
│   ├── profile/
│   ├── navigation/
│   ├── auth/
│   ├── settings/
│   └── ui/
│
├── hooks/
│
├── lib/
│   ├── api/
│   ├── socket/
│   ├── chess/
│   └── utils/
│
├── stores/
│
├── types/
│
├── services/
│
└── config/

Keep components modular.

Do not create one giant page.tsx.

5. Existing Project Migration

First inspect the existing project.

Understand:

Existing board implementation
Piece representation
Existing chess logic
Existing styling
Existing responsive behavior
Existing assets
Existing game controls

Preserve useful assets and ideas where appropriate.

However, do NOT blindly copy the existing jQuery/DOM implementation.

Convert it properly to React.

For example:

Old:

$("#1_8").html(...)

New:

<Square piece={piece} />

React state should control the board.

6. Chess Board

Create a professional chess board component.

Example:

ChessBoard
 ├── ChessSquare
 ├── ChessPiece
 ├── BoardCoordinates
 ├── MoveIndicators
 └── PromotionDialog

Support:

8 × 8 board
White pieces
Black pieces
Drag and drop
Click-to-move
Legal move indicators
Capture indicators
Last move highlighting
Check highlighting
Selected square
Board coordinates
Board flipping
Promotion dialog

Use chess.js for client-side move generation.

IMPORTANT:

Client-side chess validation is only for UI/UX.

The future NestJS backend will be the authoritative source for online games.

7. Chess Rules on Frontend

The frontend should correctly represent:

Normal moves
Captures
Check
Checkmate
Stalemate
Castling
En passant
Promotion
Draw states

Use chess.js instead of manually recreating the entire chess engine.

Create a chess abstraction such as:

lib/chess/
    chess-engine.ts
    move-utils.ts
    board-utils.ts

Do not scatter chess logic across UI components.

8. Local 1 vs 1

Implement a fully functional local game.

This mode does not require the backend.

Allow:

Player 1 name
Player 2 name
White/Black selection
Random colors
Time control
Board flip
Resign
Draw
New game
Restart game

The entire local game can run on the client.

Support local clocks.

Make sure local game state does not accidentally depend on the future backend.

9. Bot Mode UI

Create the complete frontend experience for bot games.

Bot selection:

Choose Opponent

Beginner
Easy
Medium
Hard
Expert

Allow selection of:

Bot difficulty
Color
Time control

The frontend should provide a bot-game interface.

For now, the bot implementation may be a frontend development placeholder if the eventual bot engine will live in NestJS.

IMPORTANT:

Create an interface such as:

interface ChessBot {
    getMove(position: string): Promise<string>;
}

so the implementation can later be replaced by the backend.

Do not tightly couple the UI to a fake bot.

10. Online Game UI

Create the complete UI for online multiplayer.

The backend does not exist yet, so create clean service abstractions.

For example:

services/
    game-service.ts
    auth-service.ts
    profile-service.ts
    friend-service.ts

And:

lib/socket/
    socket-client.ts
    socket-events.ts

The frontend should eventually be able to do:

gameService.createGame()
gameService.joinGame()
gameService.getGame()
gameService.makeMove()

and:

socket.emit("makeMove", ...)
socket.on("moveMade", ...)

But do not implement a WebSocket server.

11. Socket.IO Client Architecture

Prepare the frontend for the future NestJS Socket.IO gateway.

Create strongly typed event definitions.

Example:

type ClientToServerEvents = {
    joinGame: ...
    leaveGame: ...
    makeMove: ...
    resignGame: ...
    offerDraw: ...
    sendChatMessage: ...
};

type ServerToClientEvents = {
    gameState: ...
    moveMade: ...
    playerJoined: ...
    playerDisconnected: ...
    playerReconnected: ...
    gameEnded: ...
    drawOffered: ...
    chatMessage: ...
};

Keep all event definitions centralized.

Do not scatter event strings throughout components.

12. Mock Backend Layer

Because the actual NestJS backend will be developed later, create a mock/development layer.

The mock layer should allow the UI to be developed and tested without the backend.

For example:

services/
    api-client.ts
    mock/
        mock-auth.ts
        mock-games.ts
        mock-users.ts
        mock-friends.ts

The production code should be able to switch between:

Mock API
     OR
Real NestJS API

through configuration.

Do NOT build a fake backend inside Next.js.

Do not create API routes pretending to be NestJS endpoints unless they are strictly needed for frontend development.

13. Authentication UI

Create:

/login
/register

and authentication-related components.

Registration fields:

Username
Email
Password
Confirm password

Login:

Username/email
Password
Remember me if appropriate
Forgot password

The frontend should send credentials to the future NestJS backend.

Do not store passwords in frontend state longer than necessary.

Do not implement password hashing in the frontend.

14. Dashboard

Create a professional chess dashboard.

Include:

User profile
Rating
Quick Play
Play Bot
Local Game
Recent Games
Friends
Online players
Invitations
Notifications
Statistics

Example:

Welcome back, Owen

Rating: 1247

[ Quick Play ]

[ Play Bot ]    [ Local Game ]

Recent Games
---------------------
...

Make the dashboard visually polished.

15. Online Matchmaking UI

Create UI for:

Quick Play

Allow:

Time control
Rated/unrated
Searching state
Cancel search
Match found
Opponent found
Game starting countdown

The actual matchmaking will be performed by NestJS later.

The frontend only needs to represent the states.

16. Private Game UI

Create:

Create Game

Options:

Time control
Rated/unrated
Color preference
Invite friend

Generate a shareable game/invitation UI.

The actual invitation creation will eventually be handled by NestJS.

17. Main Game Screen

Create a polished game interface.

Desktop:

┌─────────────────────────────────────────────┐
│ Opponent                          Clock      │
│                                             │
│                                             │
│                 CHESS BOARD                 │
│                                             │
│                                             │
│ You                               Clock      │
└──────────────────────┬──────────────────────┘
                       │
                ┌──────▼───────┐
                │ Moves Chat   │
                │ Notes        │
                └──────────────┘

On desktop, the right panel can contain:

Moves
Chat
Notes

On mobile, use tabs/bottom sheets.

18. Player Information

Show:

Opponent:

Avatar
Username
Rating
Online status
Color
Clock

Current player:

Avatar
Username
Rating
Color
Clock

Clearly indicate whose turn it is.

19. Game Controls

Create controls for:

Resign
Offer draw
Flip board
Settings
Sound
Leave game

Use confirmation dialogs for destructive actions.

Example:

"Are you sure you want to resign?"

20. Game Result Screen

When a game ends, display:

Winner
Loser
Draw
Reason
Rating changes
Move count

Possible endings:

Checkmate
Resignation
Timeout
Stalemate
Draw by repetition
Draw by insufficient material
Draw agreement

Include:

[ Rematch ]
[ New Game ]
[ View Analysis ]
[ Back to Dashboard ]
21. Move List

Create a professional move panel.

Example:

1. e4      e5
2. Nf3     Nc6
3. Bb5     a6
4. Ba4     Nf6

Highlight:

Current move
Last move
Check
Checkmate

Allow navigation for completed games.

22. Game Replay

Create a replay interface for completed games.

Controls:

First
Previous
Next
Last

Allow users to navigate through every move.

The board should update to the corresponding position.

23. PGN UI

Create frontend functionality for:

Copy PGN
Export/download PGN
View PGN

The backend may later provide the authoritative PGN.

24. In-Game Chat

Create the Chat tab.

Features:

Message list
Input
Send button
Timestamps
Player avatars
System messages
Empty state
Loading state
Sending state
Error state

Prepare the component for Socket.IO.

Do not create a fake persistent chat backend.

Mock messages can be used during frontend development.

25. Private Notes

Create the Notes tab.

Features:

Text editor
Auto-save indicator
Saved state
Unsaved state
Clear notes
Character count if useful

Important:

Notes are private.

The UI architecture must distinguish:

myNotes

from:

opponentNotes

The opponent's notes should never appear in the UI.

26. User Profiles

Create:

/profile/[username]

Display:

Avatar
Username
Rating
Games played
Wins
Losses
Draws
Win rate
Rating history
Recent games
Friends/challenge button

Do not assume that profile data is locally available.

Use a service abstraction.

27. Friends

Create:

/friends

Sections:

Friends
Online friends
Pending requests
Sent requests
Search players

Actions:

Add friend
Accept
Reject
Remove
Challenge
28. Notifications

Create a notification system.

Examples:

Friend request
Friend request accepted
Game invitation
Challenge
Game result

Create:

Notification bell
Unread count
Notification dropdown
Notification page

Prepare for real-time notifications later.

29. Leaderboard

Create:

/leaderboard

Display:

Rank
Player
Rating
Games
Wins
Losses
Draws

Add tabs/filters for future:

Global
Friends
Blitz
Rapid
Bullet
30. Settings

Create a comprehensive settings section.

Account
Username
Email
Password
Avatar
Appearance
Light
Dark
System
Chess Board

Board themes:

Classic
Green
Blue
Brown
Purple
High contrast

Piece style selection if assets permit.

Game Settings
Show legal moves
Highlight last move
Show coordinates
Confirm moves
Auto queen
Board flip
Animation
Sound
Master volume
Move sound
Capture sound
Check sound
Game-end sound
Notification sound
Privacy

Prepare UI for:

Who can challenge me
Who can send friend requests
Show online status
Allow chat

The backend will enforce privacy rules later.

31. Theme System

Implement a robust theme system.

Use:

Light
Dark
System

Persist the preference locally.

Use CSS variables/design tokens rather than hardcoding colors throughout components.

Make sure the application does not flash an incorrect theme during page load if possible.

32. Chess Board Themes

Create a configurable board theme system.

Example type:

type BoardTheme =
    | "classic"
    | "green"
    | "blue"
    | "brown"
    | "purple"
    | "high-contrast";

Keep board colors centralized.

Do not scatter theme-specific colors throughout the board components.

33. Responsive Design

The application must work properly on:

Large desktop
Laptop
Tablet
Mobile

Especially optimize:

Chess board
Game controls
Clocks
Move list
Chat
Notes

On mobile:

Board should remain usable
Panels should become tabs/drawers
Controls should remain accessible
Do not allow horizontal scrolling unnecessarily
34. Accessibility

Implement:

Keyboard navigation
Focus states
ARIA labels
Accessible buttons
Screen-reader-friendly controls
Sufficient contrast

Chess squares should have meaningful accessibility labels where possible.

For example:

"White king on e1"

"Legal move to e4"

Do not rely exclusively on color to communicate:

Check
Legal moves
Last move
Player turn
35. Animations

Use Framer Motion selectively.

Good places:

Page transitions
Modals
Notifications
Game result
Match found
Menu transitions

Do not animate every chess move excessively.

Chess interaction should feel fast.

36. Loading States

Every major page should have appropriate loading states.

Use:

Skeletons
Spinners where appropriate
Empty states

Examples:

"Loading games..."

"Searching for opponent..."

"Connecting to game..."

"Waiting for opponent..."

37. Error States

Create polished error states.

Examples:

"Unable to connect to game."

"Game no longer exists."

"Connection lost. Reconnecting..."

"Unable to load profile."

"Something went wrong."

Avoid exposing raw API errors to users.

38. Connection Status

For online games, create a connection indicator:

● Connected
● Reconnecting...
● Offline

The component should be designed for Socket.IO.

39. Real-Time Game State Store

Create a dedicated Zustand store or equivalent for game UI state.

For example:

GameStore

Potential state:

gameId
position
moves
turn
whitePlayer
blackPlayer
whiteTime
blackTime
status
result
connectionState
selectedSquare
possibleMoves
lastMove

Do not put all application state into one global store.

Separate:

Authentication state
Game state
UI state
Settings state
40. API Client

Create a centralized API client.

Example:

lib/api/client.ts

Support:

GET
POST
PUT/PATCH
DELETE

Handle:

Base URL
Authentication
Errors
JSON
Timeouts where appropriate

Do not put fetch() calls randomly throughout components.

41. API Types

Define frontend API types.

Examples:

User
Profile
Game
Move
ChatMessage
Friend
Notification
Rating
GameInvitation

Keep these types in:

src/types/

The future backend should be able to implement APIs matching these contracts.

42. Backend Contract Preparation

Create documentation for the future NestJS developer.

Create:

docs/backend-contract.md

Document:

REST endpoints expected by frontend
Request structures
Response structures
Authentication expectations
Socket.IO events
Event payloads
Game states
Error formats

Example:

POST /auth/login

POST /auth/register

GET /users/me

GET /games/:id

POST /games

POST /games/:id/moves

POST /games/:id/resign

Also document Socket.IO events.

This is extremely important because the backend will be developed separately.

43. Mock Data

Create realistic mock data for development.

Include:

Users
Games
Moves
Friends
Notifications
Chat messages
Leaderboard

Clearly separate mock data from production services.

Do not make mock data part of the production API architecture.

44. Security Boundaries

Remember that everything in the frontend is potentially manipulable by the user.

Therefore:

Frontend can:

Display data
Request actions
Validate input for UX
Preview moves
Render game state

Backend must eventually enforce:

Authentication
Authorization
Legal moves
Game results
Ratings
Private notes
Chat permissions
Friend permissions
Game ownership

Do not create UI logic that assumes the frontend is trusted.

45. Performance

Optimize the application.

Use:

Dynamic imports where useful
Image optimization
Lazy loading
Memoization where justified
Proper React state boundaries

Do not prematurely optimize everything.

The chess board should remain responsive during gameplay.

46. SEO

Implement basic metadata for public pages.

Include appropriate metadata for:

Home
About
Public profiles
Leaderboard

Do not expose private user information through metadata.

47. Error Boundaries

Use Next.js error handling appropriately.

Implement:

error.tsx
not-found.tsx
Loading states

Where appropriate.

48. Netlify Compatibility

The final frontend MUST be deployable to Netlify.

Ensure:

pnpm build

works successfully.

Do not require a persistent Node.js server for the frontend.

Do not implement a WebSocket server inside Next.js.

The application should communicate with:

NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SOCKET_URL

for the future backend.

49. Testing

Add frontend tests for critical functionality.

Test:

Chess board rendering
Piece movement
Legal move highlighting
Promotion
Castling
Check/checkmate UI
Game controls
Settings
Theme switching
Notes
Chat UI
Authentication forms
Responsive components where practical

Use an appropriate testing stack such as:

Vitest
React Testing Library
Playwright
50. Code Quality

Run:

pnpm lint
pnpm typecheck
pnpm build

Fix all errors.

Use strict TypeScript.

Avoid:

any

unless genuinely unavoidable.

Create reusable types.

Keep components focused.

Avoid unnecessary prop drilling.

51. Visual Quality

The final application should look like a serious chess product.

It should NOT look like:

A basic university project
A plain Bootstrap website
A collection of unrelated pages
A generic admin dashboard

Aim for a polished chess-platform experience similar in quality expectations to modern chess websites/apps, while creating an original design.

Prioritize:

Chess board usability
Clear typography
Excellent spacing
Strong visual hierarchy
Smooth interactions
Responsive behavior
Dark/light themes
52. Do Not Implement Backend

This is critical.

Do NOT create:

NestJS
Express server
PostgreSQL
Prisma
Backend database
Backend WebSocket gateway
Server-side chess authority

The only networking code in this repository should be frontend clients/abstractions that communicate with the future backend.

53. Implementation Phases

Work in phases.

Phase 1 — Analyze Existing Project

Inspect the existing code.

Document:

Existing features
Existing chess logic
Assets
Problems
What can be reused

Do not immediately delete everything.

Phase 2 — Create Next.js Architecture

Set up:

Next.js
TypeScript
pnpm
Tailwind
shadcn/ui
ESLint
Project structure
Theme system
Phase 3 — Chess Board

Implement:

Board
Pieces
Moves
Legal move indicators
Captures
Check
Checkmate
Castling
En passant
Promotion
Phase 4 — Local Game

Implement a fully working:

1 vs 1 local game.

This should work without any backend.

Phase 5 — Bot UI

Implement:

Bot selection
Difficulty selection
Color selection
Time controls
Game UI

Use mock bot behavior only if necessary.

Phase 6 — Online Game UI

Implement:

Lobby
Matchmaking UI
Game creation
Joining
Game screen
Waiting states
Connection states
Phase 7 — Backend Integration Layer

Implement:

API client
Auth service
Game service
Profile service
Friend service
Notification service

Use mocks initially.

Phase 8 — Socket.IO Client

Implement:

Socket client
Typed events
Connection state
Game events
Chat events
Reconnection handling

No server.

Phase 9 — User Experience

Implement:

Dashboard
Profiles
Friends
Notifications
Leaderboard
Game history
Replay
Phase 10 — Settings

Implement:

Account
Appearance
Board themes
Piece preferences
Game settings
Sound
Privacy
Phase 11 — Polish

Improve:

Mobile
Accessibility
Animations
Loading states
Error states
Empty states
Performance
Phase 12 — Testing

Run:

pnpm lint
pnpm typecheck
pnpm test
pnpm build

Fix all issues.

54. Final Deliverables

At completion, provide:

Next.js frontend
README.md
.env.example
docs/backend-contract.md
docs/frontend-architecture.md
Testing setup
Mock API layer
Socket.IO client layer
Responsive UI
Theme system
Chess board
Local chess mode
Bot interface
Online chess interface
Authentication UI
Dashboard
Profiles
Friends
Notifications
Leaderboard
Game history
Game replay
Chat
Private notes
Settings
55. Final Acceptance Criteria

The frontend is complete when:

It runs with pnpm.
pnpm dev works.
pnpm build succeeds.
It is deployable to Netlify.
The local 1v1 chess mode works completely.
Chess.js correctly handles chess rules on the client.
Bot mode UI works.
Online multiplayer UI is complete.
Socket.IO client architecture is ready.
Authentication UI is complete.
Dashboard is complete.
Profiles are complete.
Friends UI is complete.
Notifications UI is complete.
Leaderboard is complete.
Game history UI is complete.
Game replay works.
Chat UI is complete.
Private notes work locally/mock-wise.
Settings work.
Themes work.
Mobile UI works.
Accessibility has been considered.
API and WebSocket contracts are documented.
No backend code has been created.
No database has been created.
No secrets are hardcoded.
The application has clean TypeScript architecture.
MOST IMPORTANT INSTRUCTION

Build this as a frontend that is ready to connect to a serious NestJS backend, not as a fake full-stack application.

Every feature that requires persistence, authentication, multiplayer synchronization, matchmaking, ratings, chat persistence, or authoritative game validation must have a clearly defined frontend service/API contract.

The frontend should work independently in local/demo mode while the backend is being developed, but replacing the mock services with the real NestJS API should require minimal changes.
