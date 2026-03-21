# CLAUDE.md

## Project Overview

Sable is a local-first writing app built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Tiptap, and Electron.

The app has two practical runtime targets:

- Next.js in development
- Electron on Windows, loading the statically exported Next app from `out/`

The product is centered on private, on-device writing with rich editing, writing tools, local export/import, and optional AI assistance.

## Core Commands

Use `bun` for normal workflows.

```bash
bun install
bun run dev
bun run build
bun run electron
bun run electron:dev
bun run electron:build
```

Additional repo scripts:

```bash
bun run start
bun run lint
```

Notes:

- `next.config.ts` sets `output: 'export'`, so builds must remain compatible with static export.
- `bun run electron:dev` starts Next on port `3000` and then launches Electron.
- `bun run electron:build` runs the web build first, then packages the Windows app with `electron-builder`.
- Build artifacts already present in the repo include `.next/`, `out/`, and `dist/`.

## Environment And External Services

Environment variables used by the repo:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)

External network calls in the current codebase:

- OpenAI Chat Completions from `app/api/agent/route.ts`
- LanguageTool from `app/api/grammar/route.ts`
- LanguageTool directly from `lib/grammar.ts` on the client for inline grammar checking
- Dictionary API from `lib/dictionary.ts`
- FormSubmit from `components/FeedbackModal.tsx`

This means the app is local-first, but not fully offline for AI, grammar, dictionary, or feedback features.

## High-Level Architecture

### App Structure

- `app/layout.tsx` defines metadata, global CSS, and the root provider wrapper.
- `app/providers.tsx` mounts `SettingsProvider`, `DocumentsProvider`, Lenis scrolling, and the global command palette.
- `app/page.tsx` is the document library.
- `app/editor/page.tsx` and `app/editor/EditorPageClient.tsx` route into the editor by `id` query param.
- `app/settings/page.tsx` is the standalone settings screen.

### State And Persistence

The app has no database. State is persisted in `localStorage`.

Primary stores:

- `context/DocumentsContext.tsx`
- `context/SettingsContext.tsx`

Important storage keys:

- `sable_documents`
- `sable_settings`
- `sable_writing_stats`
- `sable_history_<docId>`
- `sable-goal-*`

Document persistence helpers live in `lib/documents.ts`.
Backup/import-export for all Sable-related keys lives in `lib/backup.ts`.
Writing analytics persistence lives in `lib/writingStats.ts`.
Snapshot history lives in `lib/history.ts`.

### Document Model

The core document type is `SableDocument` in `lib/types.ts`.

Important fields:

- `content`: stringified Tiptap JSON
- `notes`: sketchpad text
- `moodBoard`: mood board items
- `marginNotes`: paragraph-anchored side notes
- `tags`
- `isDeleted`, `isFavorited`, `isArchived`

Do not treat document content as Markdown or plain HTML in storage. Tiptap JSON is the source of truth.

### Editor Surface

The editor shell is `components/editor/EditorCanvas.tsx`.

Major editor features currently implemented:

- Tiptap-based rich text editing in `components/editor/TiptapEditor.tsx`
- live HTML preview
- debounced autosave into document state
- periodic local snapshots
- slash-command driven AI actions
- side-panel AI assistant
- grammar highlighting and suggestions
- dictionary lookup for selected words
- image paste/drop with inline image nodes
- table editing
- search and replace
- outline panel
- margin note gutter
- mood board panel
- sketchpad panel
- readability badge
- word count badge
- writing goals
- sprint timer
- ambient sound player
- keystroke sound effects
- publish/export modal

The editor also has focus mode, typewriter mode, and a client-side fullscreen UI state.

### Library And Settings Surface

Library behavior is mainly in:

- `app/page.tsx`
- `components/library/*`

Current library features include:

- recent, favorites, and archived views
- title/content/tag search
- sort by updated time
- create, rename, duplicate, archive, favorite, soft-delete
- import/export of all local data

Settings behavior is mainly in:

- `app/settings/page.tsx`
- `context/SettingsContext.tsx`

Current persisted settings:

- theme
- font size
- line spacing
- snapshot interval
- keystroke sound theme and volume
- ambient sound type and volume

### Export And Publishing

Document export lives in `lib/export.ts` and is triggered from `components/editor/PublishModal.tsx`.

Supported export/publish formats:

- PDF via print iframe
- Markdown via `turndown`
- HTML
- zine/booklet-style print layout

Tags are also editable inside the publish modal and persist back to the document.

### Command Surface

- `components/CommandPalette.tsx` implements the global `Cmd/Ctrl + K` palette.
- `lib/slash-command.ts` and `components/editor/SlashCommand.tsx` implement slash-command suggestions inside the editor.

### API Routes

Server routes:

- `app/api/agent/route.ts`
- `app/api/grammar/route.ts`

`app/api/agent/route.ts`:

- validates action and input size
- requires `OPENAI_API_KEY`
- calls `https://api.openai.com/v1/chat/completions`
- supports `fix_grammar`, `rewrite`, `summarize`, and `continue`
- returns plain text suggestions only
- uses a 20 second timeout

`app/api/grammar/route.ts`:

- proxies requests to the public LanguageTool API
- returns `{ matches: [] }` on invalid input or failure
- uses an 8 second timeout

Important: inline grammar checking in the editor does not use this route. `lib/grammar.ts` calls LanguageTool directly from the client.

### Electron

Electron entry point: `electron/main.js`

Current behavior:

- dev mode loads `http://localhost:3000`
- packaged mode serves the static export from `out/` over a custom `app://` protocol
- the custom protocol handles HTML route fallback and byte-range requests for media
- Electron is configured for Windows packaging via `electron-builder`

Any changes to routing, asset paths, or media loading need to remain compatible with both static export and the custom Electron protocol.

## Conventions For Changes

When changing this repo:

- Keep state in the existing React contexts unless there is a strong reason not to.
- Preserve the local-first storage model.
- Treat Tiptap JSON as canonical document content.
- Preserve `localStorage` key formats unless you add an explicit migration path.
- Keep static export compatibility.
- Keep Electron packaging compatibility with `out/`.
- Avoid introducing server-side assumptions that do not work with exported Next builds.
- Prefer soft-failure behavior for network-backed helpers where that pattern already exists.
- Be careful with user-facing AI output contracts; the UI expects plain text suggestions, not structured markdown.

## Things To Watch

- Search in `app/page.tsx` currently matches against raw serialized `d.content`, not extracted plain text.
- `deleteDoc` in `DocumentsContext` is a soft delete (`isDeleted: true`), not physical removal.
- Grammar support is split between a server route and direct client fetches to LanguageTool.
- The settings page markets the app as offline/local-only, but several features rely on third-party network calls.
- There is no formal automated test suite in the repo right now.
- The worktree may contain generated or user-authored changes; do not assume `app/layout.tsx` or `public/` assets are untouched.

## Recommended Workflow For Future Work

1. Read the relevant page, panel, context, and helper modules before changing behavior.
2. If the feature touches persistence, inspect `context/DocumentsContext.tsx`, `context/SettingsContext.tsx`, and the relevant `lib/*` storage helpers first.
3. If the feature touches editor behavior, inspect `components/editor/EditorCanvas.tsx` and `components/editor/TiptapEditor.tsx` before changing surrounding UI.
4. If the feature touches AI flows, inspect both `components/editor/AIAgentPanel.tsx` and `app/api/agent/route.ts`.
5. If the feature touches grammar, inspect both `app/api/grammar/route.ts` and `lib/grammar.ts`.
6. If the feature touches export or backup, inspect `lib/export.ts`, `lib/backup.ts`, and `components/editor/PublishModal.tsx`.
7. Run the narrowest useful verification command after changes; use `bun run build` when you touch integration boundaries, routing, export behavior, or Electron-facing assets.

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
- `components/editor/EditorCanvas.tsx`
- `components/editor/TiptapEditor.tsx`
- `components/editor/AIAgentPanel.tsx`
- `components/editor/PublishModal.tsx`
- `components/editor/HistoryPanel.tsx`
- `components/editor/FindReplacePanel.tsx`
- `components/CommandPalette.tsx`
- `components/FeedbackModal.tsx`
- `lib/documents.ts`
- `lib/types.ts`
- `lib/templates.ts`
- `lib/history.ts`
- `lib/backup.ts`
- `lib/export.ts`
- `lib/writingStats.ts`
- `lib/grammar.ts`
- `lib/dictionary.ts`
- `lib/slash-command.ts`
