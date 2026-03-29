# Rello

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime3FC54C)](https://supabase.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-yellow)](https://zustand-demo.pmnd.rs/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8)](https://tailwindcss.com)

[Live Demo]()

## 1. Project Overview

Rello is a Trello-like Kanban board application built with modern web technologies. It provides real-time collaborative board management with drag-and-drop task organization, supporting multiple lists, task reordering, and instant synchronization across clients.

## 2. Architecture & Folder Structure

```
rello/
├── app/                          # Next.js App Router
│   ├── (browser)/                # Browser-only route group
│   │   ├── (auth)/               # Auth pages (login, register, password reset)
│   │   ├── (landing)/           # Public landing page
│   │   └── dashboard/           # Protected dashboard
│   │       └── boards/[id]/
│   │           ├── _components/ # Route-scoped components
│   │           ├── _hooks/      # Route-scoped hooks
│   │           └── actions.ts    # Server actions
│   └── api/auth/                # Auth route handlers
├── components/ui/               # Shared shadcn/ui primitives only
├── store/                        # Global Zustand stores
├── lib/supabase/                 # Supabase client utilities
└── hooks/                        # Shared hooks
```

### Architectural Decisions

**Route Groups (`(browser)`, `(auth)`, `(landing)`)**: Next.js route groups use parentheses to organize routes without adding URL segments. The `(browser)` group ensures these routes render in the browser context, which is required for Supabase Auth's session handling and redirect flows.

**Co-location with Underscore Prefix**: The `_components` and `_hooks` directories within route segments follow Next.js conventions for route-scoped code. These components and hooks are intentionally not exported from the route—they exist only for that specific page. The underscore prefix signals to developers that these are not shared, reusable modules.

**Store at Root Level**: The `store/` directory lives at the project root rather than inside `app/` because Zustand stores are client-side state that should not be bundled into Server Components. Placing them outside `app/` makes the separation explicit and prevents accidental imports in server-side code.

**Server vs Client Components**: Server Components handle initial data fetching (`lib/supabase/get-board.ts`) and form submissions via Server Actions (`actions.ts`). Client Components manage all interactive UI—drag-and-drop, state mutations, and real-time subscriptions.

## 3. State Management Approach

The application uses a two-store pattern to separate concerns:

### `useBoardStore` — Server State
- Holds the canonical board data: `board`, `lists`, and `tasks`
- All mutations are performed via Immer middleware for immutable updates
- Includes `handleRealtimeTaskUpdate` for merging incoming real-time changes

### `usePendingOpsStore` — UI State
- Tracks optimistic operations with `pendingOps` (Map of operation keys to timestamps)
- Manages `awaitingEcho` — operations that were sent to the server but not yet confirmed
- Maintains `localVersions` (Map of entity keys to version numbers) to detect stale updates

### Interaction Flow

1. User performs an action (e.g., moves a task)
2. Optimistic update immediately applies to `useBoardStore` for instant UI feedback
3. Operation key is registered in `usePendingOpsStore.pendingOps`
4. Server action is invoked
5. On success: `clearOp()` moves the operation to `awaitingEcho`, waiting for the realtime echo
6. When the realtime subscription receives the echo: `confirmEcho()` clears the tracking
7. If server action fails: rollback logic would need to be implemented (not currently handled)

The separation allows `useBoardStore` to focus on representing the current board state while `usePendingOpsStore` handles the temporal complexity of optimistic updates and echo suppression.

## 4. Real-Time Implementation

Supabase Realtime subscriptions are established per-board via `useRealtimeSync`:

```typescript
const channel = supabase
  .channel(`board:${boardId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'tasks', filter: `board_id=eq.${boardId}` }, handleTaskInsert)
  .on('postgres_changes', { event: 'UPDATE', table: 'tasks', filter: `board_id=eq.${boardId}` }, handleTaskUpdate)
  // ... more handlers
  .subscribe()
```

### Echo Suppression

When a local operation is performed, it's registered in `pendingOpsStore` before the server action is called. When the realtime channel receives that same change back, the handler checks:

```typescript
const key = `task:update:${payload.new.id}`
const { isPending, confirmEcho } = usePendingOpsStore.getState()
if (isPending(key)) {
  confirmEcho(key)  // Skip applying, just confirm we received our own echo
  return
}
```

### Version Tracking

For updates, a local version is bumped whenever a local change is made:

```typescript
const entityKey = `task:${task.id}`
const localVersion = bumpVersion(entityKey)
```

When receiving a realtime update, if `localVersion > 0`, the update is skipped because it originated locally and hasn't been confirmed yet.

### Stale Operation Cleanup

An interval runs every 10 seconds to clear operations older than 8 seconds:

```typescript
if (now - timestamp > 8000) {
  newAwaiting.delete(key)
  // Clear version tracking too
}
```

This handles edge cases where realtime messages are lost or delayed.

### Connection Status

The `RealtimeIndicator` component displays the current connection state (`connected`, `connecting`, `disconnected`) based on the channel subscription status.

## 5. Trade-offs & Assumptions

### Trade-offs

- **Supabase Auth vs. Simple Simulation**: Full Supabase Auth adds complexity (RLS policies, session management, password reset flows) but provides real multi-user isolation, production-ready security, and is the appropriate choice for a deployed application.

- **Zustand vs. Redux Toolkit**: Zustand requires significantly less boilerplate. For this scale (two stores, ~15 actions total), Redux Toolkit's typed hooks and slice patterns would add unnecessary ceremony.

- **Server Actions vs. REST API**: Server Actions provide direct function calls from Client Components without an explicit API layer. The tradeoff is less control over caching and response handling—fine for this use case but would need reconsideration for high-traffic public APIs.

- **Optimistic UI Complexity**: The pending ops store, rollback logic, echo suppression, and version tracking add ~150 lines of code. This significantly improves perceived performance but increases maintenance burden.

- **Dynamic Lists vs. Hardcoded Columns**: Rello creates default lists (To Do, In Progress, Done) on board creation rather than hardcoding them, allowing users to customize their workflow.

### Assumptions

- **Single Board View**: The implementation assumes one board per view. Cross-board drag-and-drop or bulk operations across boards are not supported.
- **Integer Positioning**: Task positions are simple integers, not fractional (e.g., 1, 2, 3). Reordering any task requires recalculating positions for affected items.
- **Board-Level Visibility**: There is no per-list or per-task visibility control. Access is all-or-nothing at the board level.
- **Online Required**: No offline support exists. The realtime subscriptions require an active connection; the app will not function without network access.

## 6. Getting Started

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Supabase Setup

1. Create a Supabase project
2. Run the following SQL to create tables:

```sql
create table boards (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

create table lists (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  board_id uuid references boards(id) on delete cascade not null,
  position integer not null default 0,
  created_at timestamptz default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  list_id uuid references lists(id) on delete cascade not null,
  board_id uuid references boards(id) on delete cascade not null,
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

3. Enable RLS policies for authenticated access to all tables
4. Enable Supabase Realtime for the `lists` and `tasks` tables in the Supabase dashboard

## 7. AI Tools Usage

Claude (Anthropic) was used extensively throughout development for architecture review, code generation, refactoring prompts, and debugging. Cursor (built on Claude) provided IDE-level assistance with inline code completion and refactoring. ChatGPT was consulted for specific API questions and conceptual clarification. All generated code was reviewed against existing patterns in the codebase before committing—AI output served as a starting point that required validation against the specific conventions and constraints of this project.
