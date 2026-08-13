# TaskFlow

A simple Trello-style task board. React frontend, Express + SQLite backend, no
authentication, no realtime, no file uploads — just boards, columns, and tasks
that persist to a real database.

## Overview

TaskFlow has a single board with three fixed columns (To Do, In Progress,
Done). You can create, edit, move, and delete tasks, and filter the board by
priority. Every change is written to a SQLite file on disk, so it survives a
page reload or a server restart.

## Features

- View the board and its three columns
- Create a task (title required, description/priority optional)
- Edit a task's title, description, and priority
- Move a task between columns with a dropdown (no drag-and-drop required)
- Delete a task, with a confirmation prompt
- Filter tasks by priority (All / Low / Medium / High)
- Loading states, inline error messages, and success toasts
- Empty states for empty columns and "no tasks match this filter"
- Responsive layout — columns stack on narrow screens, no horizontal scroll

## Tech Stack

**Frontend:** React, Vite, plain CSS
**Backend:** Node.js, Express, SQLite via `better-sqlite3`
**Testing:** Vitest, Supertest

## Project Structure

```
taskflow/
  client/                 React app (Vite)
    src/
      components/         Board, Column, TaskCard, TaskModal, Filter, Toast
      api.js               fetch wrapper for the backend
      App.jsx              top-level state + data flow
  server/
    src/
      db/
        schema.sql         CREATE TABLE statements
        db.js               opens the SQLite connection, applies schema.sql
        queries.js          every SQL query used by the app lives here
        seed.js              resets and seeds demo data
      routes/
        boards.js           GET board / tasks / task-counts
        tasks.js             POST / PUT / PATCH move / DELETE
      middleware/
        errorHandler.js     centralized error handling
      index.js               Express app entry point
    tests/
      tasks.test.js          API-level tests (validation, move)
      queries.test.js        direct SQL query tests
  README.md
  package.json              convenience scripts to run both apps together
```

## Database Schema

**Board → Columns → Tasks**, a strict one-to-many chain:

- A **board** has many **columns** (`columns.board_id → boards.id`)
- A **column** has many **tasks** (`tasks.column_id → columns.id`)
- Both foreign keys cascade on delete, and `PRAGMA foreign_keys = ON` is set
  on every connection (SQLite doesn't enforce foreign keys unless you ask).

```sql
CREATE TABLE boards (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE columns (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER NOT NULL,
  title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);
```

Indexes on `columns.board_id`, `tasks.column_id`, and `tasks.priority` back
the queries below.

## SQL Queries

The full query module is [`server/src/db/queries.js`](server/src/db/queries.js).
The two non-trivial ones:

**Count tasks per column for a board** (used to show column counts; a
`LEFT JOIN` so empty columns still show `0` instead of disappearing):

```sql
SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
FROM columns c
LEFT JOIN tasks t ON t.column_id = c.id
WHERE c.board_id = ?
GROUP BY c.id, c.name
ORDER BY c.position ASC
```

**Tasks with a given priority, newest first** (backs the priority filter):

```sql
SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
FROM tasks t
JOIN columns c ON c.id = t.column_id
WHERE c.board_id = ? AND t.priority = ?
ORDER BY t.created_at DESC, t.id DESC
```

## API Endpoints

| Method | Path                        | Description                                      |
|--------|-----------------------------|---------------------------------------------------|
| GET    | `/api/boards/:boardId`      | Board details + its columns                       |
| GET    | `/api/boards/:boardId/tasks`| All tasks for the board (`?priority=High` to filter) |
| GET    | `/api/boards/:boardId/task-counts` | Task count per column                       |
| POST   | `/api/tasks`                | Create a task (`title`, `column_id` required)      |
| PUT    | `/api/tasks/:taskId`        | Update title / description / priority             |
| PATCH  | `/api/tasks/:taskId/move`   | Move a task to a different `column_id`             |
| DELETE | `/api/tasks/:taskId`        | Delete a task                                      |

All errors return JSON in the shape `{ "error": "message" }`. Validation
failures return `400`, missing resources return `404`, unexpected errors
return `500` with no stack trace leaked to the client.

## Installation

From a fresh clone:

```bash
npm install          # root deps (just `concurrently`, used by `npm run dev`)
npm run install:all  # installs server/ and client/ dependencies
```

`install:all` is equivalent to running `npm install` inside `server/` and
`client/` separately, if you'd rather do it manually.

## Database Setup

The SQLite file (`server/src/db/taskflow.sqlite3`) is created automatically —
`db.js` runs `schema.sql` every time the server starts, and `CREATE TABLE IF
NOT EXISTS` makes that safe to repeat. To load the demo data (1 board, 3
columns, 7 sample tasks):

```bash
npm run seed
```

Run this once after install, and again any time you want to reset back to
the demo data.

## Running the Application

Run backend and frontend separately:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Or both together from the project root:

```bash
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to
the Express server, so no CORS configuration is needed in development.

## Running Tests

```bash
npm test
```

Runs the Vitest suite in `server/tests` against a separate SQLite file
(`server/src/db/test.sqlite3`), so tests never touch your dev/demo data.

## Design Decisions

**Why SQLite:** the assignment needs real persistence without the overhead of
running a separate database server. `better-sqlite3` is synchronous, which
keeps the query code simple and easy to read line-by-line — there's no
async/await ceremony around every database call, which matters for an
app this size meant to be explained in an interview.

**Why a dropdown instead of mandatory drag-and-drop:** drag-and-drop is
nice-to-have polish, but it adds real complexity (drag libraries, touch
support, accessibility for keyboard users) for a task board this small. A
`<select>` per card does the same job — move a task to another column — with
none of that risk, and it's the first thing a reviewer can click without
guessing how the interaction works. The spec explicitly allows this, and
frames drag-and-drop as an optional stretch goal.

## Assumptions

- Single board only — there's no "create board" flow, since the spec is
  scoped to one board with fixed columns (To Do / In Progress / Done).
- The board and its three columns are assumed to already exist via the seed
  script; the API doesn't expose column creation.
- `description` is optional and stored as `NULL` when blank, not an empty
  string.
- Deleting a column would cascade-delete its tasks (enforced at the DB
  level), but there's no UI for deleting columns since columns aren't
  user-editable in this scope.
- Task ordering within a column is by creation time (newest first) — there's
  no manual re-ordering within a column.

## What I Would Improve With More Time

- Manual drag-and-drop, and free re-ordering of tasks within a column
  (would need a `position` column on `tasks`, similar to `columns.position`)
- A title search box (mentioned as a stretch goal)
- Multi-board support with a board switcher
- Nicer optimistic-UI rollback messaging when a move fails
- More edge-case tests (e.g. deleting a column's last task, concurrent moves)

## Time Spent

Roughly 3–4 hours: schema and queries first, then the API and its tests,
then the frontend, then a final pass fixing mismatches between the two.

## What I Learned

`better-sqlite3` doesn't turn on foreign key enforcement by default — you
have to run `PRAGMA foreign_keys = ON` on every connection, otherwise SQLite
will silently let you insert a task pointing at a `column_id` that doesn't
exist. It's a one-line fix, but easy to miss until a "shouldn't be possible"
bug shows up in testing.
