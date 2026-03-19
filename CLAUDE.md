# CLAUDE.md

## Project Overview

Sable is a focused writing app built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Electron.

The app has two primary runtime modes:

- Web/Next.js during development via `next dev`
- Electron for desktop packaging, loading the exported static Next build from `out/`

The product centers on local-first document editing with optional AI-assisted writing and grammar help.

## Core Commands

Use `bun` for regular project workflows unless there is a clear reason to use another tool.

```bash
bun install
bun run dev
bun run build
bun run electron
bun run electron:dev
bun run electron:build
```

Notes:

- `bun run build` runs `next build` and emits a static export because `next.config.ts` sets `output: 'export'`.
- `bun run electron:dev` starts Next on port `3000` and then launches Electron.
- `bun run electron:build` depends on a successful web build and packages the Windows desktop app with `electron-builder`.

## Environment Variables

The only OpenAI-related environment variables currently used by the repo are:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

`OPENAI_MODEL` is optional. The code falls back to `gpt-4o-mini` when it is unset.

## Architecture

### App Shell

- `app/layout.tsx` sets up global fonts, global CSS, and providers.
- `app/providers.tsx` wraps the app with `SettingsProvider`, `DocumentsProvider`, and smooth scrolling.
- `app/page.tsx` is the main library/dashboard view.
- `app/editor/EditorPageClient.tsx` routes to the editor based on the `id` query param.

### State and Persistence

State is client-side and local-first.

- `context/DocumentsContext.tsx` is the primary document state container.
- `context/SettingsContext.tsx` stores UI/editor settings.
- `lib/documents.ts` handles `localStorage` load/save and document creation helpers.
- Documents are stored under `sable_documents` in `localStorage`.
- Settings are stored under `sable_settings` in `localStorage`.
- Snapshot history is stored per document under `sable_history_<docId>` via `lib/history.ts`.
- Backup/import-export behavior is implemented in `lib/backup.ts` and includes:
  - `sable_documents`
  - `sable_settings`
  - `sable_writing_stats`
  - `sable-goal-*`
  - `sable_history_*`

There is no database in the current codebase.

### Document Model

`lib/types.ts` defines the key types:

- `SableDocument`
- `MoodBoardItem`
- `MarginNote`

Important details:

- Document `content` is stored as a stringified Tiptap JSON document, not plain Markdown or HTML.
- The app is built around local document metadata like favorites, archive state, notes, mood board items, and margin notes.

### Editor/UI

The editor-related UI lives mostly in:

- `components/editor/*`
- `app/editor/*`

The library/home view lives mostly in:

- `app/page.tsx`
- `components/library/*`

The settings experience lives in:

- `app/settings/page.tsx`
- `context/SettingsContext.tsx`

Important supporting client modules include:

- `lib/history.ts` for version snapshots
- `components/editor/HistoryPanel.tsx` for restoring snapshots
- `lib/backup.ts` for import/export
- `lib/writingStats.ts` and `hooks/useWritingTracker.ts` for writing metrics

Visual behavior includes GSAP-based UI motion and Lenis smooth scrolling.

### API Routes

There are two server routes in the current app:

- `app/api/agent/route.ts`
- `app/api/grammar/route.ts`

`app/api/agent/route.ts`:

- Calls OpenAI directly using `fetch`
- Uses `https://api.openai.com/v1/chat/completions`
- Supports `fix_grammar`, `rewrite`, `summarize`, and `continue`
- Uses `OPENAI_MODEL ?? 'gpt-4o-mini'`

`app/api/grammar/route.ts`:

- Calls the public LanguageTool API
- Returns matches only
- Fails soft by returning an empty match list on errors

### Electron

`electron/main.js` is the desktop wrapper.

Key behavior:

- In development, Electron loads `http://localhost:3000`
- In packaged mode, Electron serves the static exported app from `out/` through a custom `app://` protocol
- The custom protocol includes range request handling for media playback

## Conventions For Changes

When editing this repo, prefer the existing architectural style:

- Keep document and settings state in the existing React contexts unless there is a clear reason to introduce a new store
- Preserve the local-first model and avoid introducing backend persistence unless explicitly requested
- Treat Tiptap JSON as the source of truth for document content
- Preserve existing localStorage key formats unless a migration is intentionally added
- Keep Electron packaging compatible with static export
- Avoid introducing dependencies unless the current stack cannot handle the requirement cleanly

For AI-related changes:

- Preserve the current soft-failure behavior where practical
- Keep prompts and output contracts strict because the UI expects plain text suggestions
- Be explicit about request limits and timeouts

## Things To Watch

- Because the app uses static export, not every Next.js server feature is a good fit
- Electron packaging depends on the exported `out/` structure remaining valid
- Search in `app/page.tsx` currently checks `d.content.toLowerCase()`, which is searching raw serialized content rather than extracted plain text
- The repo does not currently include a formal test suite

## Recommended Workflow For Future Work

1. Read the relevant page, component, context, and helper modules before changing behavior.
2. If the feature touches document state, inspect `DocumentsContext` and `lib/documents.ts` first.
3. If the feature touches settings, inspect `SettingsContext`.
4. If the feature touches backup/import, inspect `lib/backup.ts` and the library/settings entry points that call it.
5. If the feature touches history/versioning, inspect `lib/history.ts` and `components/editor/HistoryPanel.tsx`.
6. If the feature touches AI behavior, inspect `app/api/agent/route.ts` and any calling editor components.
7. After changes, run the narrowest useful verification command, then run `bun run build` if the change affects integration boundaries.

## High-Value Files

- `package.json`
- `next.config.ts`
- `electron/main.js`
- `app/layout.tsx`
- `app/providers.tsx`
- `app/page.tsx`
- `app/settings/page.tsx`
- `app/editor/EditorPageClient.tsx`
- `app/api/agent/route.ts`
- `app/api/grammar/route.ts`
- `context/DocumentsContext.tsx`
- `context/SettingsContext.tsx`
- `components/editor/HistoryPanel.tsx`
- `lib/backup.ts`
- `lib/documents.ts`
- `lib/history.ts`
- `lib/types.ts`
