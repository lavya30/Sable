<div align="center">

<img src="public/icon.png" alt="Sable Logo" width="100" height="100" />

# Sable

**A beautiful, local-first writing app for focused, distraction-free writing.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Features](#-features) · [Screenshots](#-screenshots) · [Getting Started](#-getting-started) · [Tech Stack](#-tech-stack) · [AI Setup](#-ai-assistant-setup)

</div>

---

## ✨ Overview

Sable is a **privacy-first, local-first** writing application that keeps all your documents on your device — no accounts, no cloud sync, no tracking. Built for writers who want a clean, powerful editing experience with tools for creativity, analytics, and AI-assisted writing.

> All your data lives in your browser's local storage. Nothing is sent to any server unless you explicitly use an AI feature.

---

## 🚀 Features

### 📝 Rich Text Editor
- Full-featured **Tiptap** editor with bold, italic, headings, lists, tables, links, and images
- **Inline image** support via paste or drag-and-drop
- **Slash commands** (`/fix_grammar`, `/rewrite`, `/summarize`, `/continue`) for quick AI actions
- **Search & replace** with keyboard shortcut support
- **Auto-save** with visual indicator

### 🎨 Creative Tools
| Tool | Description |
|------|-------------|
| **Mood Board** | Collect images, colors, links, and notes for visual inspiration |
| **Sketchpad** | A quick-access side panel for brainstorming and rough notes |
| **Margin Notes** | Annotate paragraphs with colorful sticky notes in the document gutter |
| **Outline Panel** | Auto-generated document structure from headings |

### 🤖 AI Assistant *(Bring Your Own Key)*
- Grammar fixing, text rewriting, summarization, and continuation
- Supports **OpenAI** (GPT-4o, GPT-4.1), **Google Gemini** (2.0/2.5 Flash, 2.5 Pro), and **Anthropic Claude** (3.5 Haiku, Sonnet 4, Opus 4)
- Keys are stored locally — never leave your device
- Accessible via slash commands or the side AI panel

### ✍️ Writing Modes
- **Focus Mode** — hides the toolbar for a clean, distraction-free canvas
- **Typewriter Mode** — keeps the current line centered as you type
- **Live Preview** — split-pane rendered preview alongside the editor
- **Fullscreen** — immersive full-window editing

### 📊 Writing Analytics
- **Word & character count** badge in the status bar
- **Readability score** (Flesch–Kincaid grade level)
- **Writing sprint timer** for timed sessions
- **Writing goal tracking** with progress indicators
- **Activity calendar** showing your daily writing streaks

### 🕑 Version History
- Periodic **snapshot-based history** with configurable intervals
- Restore any previous version with a single click
- Visual diff view between snapshots

### 📤 Export & Publish
- **HTML** — fully styled, self-contained document
- **Markdown** — clean Markdown via Turndown
- **PDF** — print-to-PDF through a formatted print view
- **Zine** — a booklet-style print layout
- **Full backup** — export/import all documents and settings as JSON

### 🎵 Ambience & Sounds
- **Ambient audio player** with multiple soundscapes (rain, forest, café, etc.)
- **Keystroke sounds** with configurable volume and sound themes

### 🗂️ Document Library
- Grid view with rich document cards
- Organize with **tags**, **favorites**, and **archive**
- Full-text and tag-based **search**
- Sort by last updated
- Soft-delete and restore

---

## 📸 Screenshots

<div align="center">

| Library | Editor |
|---------|--------|
| <img src="public/ss1.png" alt="Document Library" width="400"/> | <img src="public/ss2.png" alt="Editor View" width="400"/> |

| AI Assistant | Mood Board |
|--------------|------------|
| <img src="public/ss3.png" alt="AI Assistant" width="400"/> | <img src="public/ss4.png" alt="Mood Board" width="400"/> |

</div>

---

## 🏁 Getting Started

### Prerequisites

- **[Bun](https://bun.sh)** (recommended) or Node.js ≥ 18
- **[Git](https://git-scm.com)**

### Installation

```bash
git clone https://github.com/lavya30/Sable.git
cd Sable
bun install
```

### Run in the Browser

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run as a Desktop App (Electron)

```bash
# Development — starts Next.js + Electron with hot reload
bun run electron:dev

# Build & package the Windows installer
bun run electron:build
```

The packaged installer will be output to the `dist/` directory.

---

## 🛠️ All Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the Next.js development server |
| `bun run build` | Build the static export to `out/` |
| `bun run start` | Serve the built app |
| `bun run lint` | Run ESLint |
| `bun run electron` | Launch Electron (requires a prior build) |
| `bun run electron:dev` | Start Next.js dev server and launch Electron |
| `bun run electron:build` | Build the app and package the Windows installer |

---

## 🧰 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (static export) |
| UI Library | [React 19](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Rich Text | [Tiptap 3](https://tiptap.dev/) (ProseMirror) |
| Desktop | [Electron 41](https://www.electronjs.org/) |
| Animations | [GSAP 3](https://gsap.com/), [Lenis](https://lenis.darkroom.engineering/) |
| Charts | [Recharts](https://recharts.org/), [react-activity-calendar](https://grubersjoe.github.io/react-activity-calendar/) |
| Export | [Turndown](https://github.com/mixmark-io/turndown) (Markdown conversion) |
| Commands | [cmdk](https://cmdk.paco.me/) |
| Runtime | [Bun](https://bun.sh/) |

---

## 🤖 AI Assistant Setup

Sable uses a **Bring Your Own Key (BYOK)** model. Your API keys are stored in your browser's `localStorage` and never sent to any Sable server.

1. Open **Settings** → **AI Assistant**
2. Choose your preferred provider
3. Enter your API key

### Supported Providers

| Provider | Models | Where to get a key |
|----------|--------|--------------------|
| **OpenAI** | GPT-4o Mini, GPT-4o, GPT-4.1 Mini, GPT-4.1 | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | Gemini 2.0 Flash, 2.5 Flash, 2.5 Pro | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Anthropic Claude** | Claude 3.5 Haiku, Sonnet 4, Opus 4 | [console.anthropic.com](https://console.anthropic.com/keys) |

> **Privacy note:** API calls are made directly from your browser/device to the AI provider. Sable never proxies or stores your requests.

---

## 🗄️ Data & Privacy

Sable is **100% local-first**:

- All documents are stored in **`localStorage`** under the key `sable_documents`
- Settings are stored under `sable_settings`
- Writing statistics, snapshot history, and goals all remain on-device
- Use **Settings → Export Backup** to download a full JSON backup of all your data
- **No account required. No tracking. No analytics.**

---

## 📁 Project Structure

```
Sable/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Document library
│   ├── editor/             # Editor route
│   ├── settings/           # Settings page
│   └── api/grammar/        # Grammar proxy API
├── components/
│   ├── editor/             # All editor sub-components
│   └── library/            # Library view components
├── context/                # React Contexts (Documents, Settings)
├── lib/                    # Core helpers (AI, export, grammar, history…)
├── hooks/                  # Custom React hooks
├── electron/               # Electron main process
└── public/                 # Static assets (icons, fonts, sounds)
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for writers who love their privacy.

</div>
