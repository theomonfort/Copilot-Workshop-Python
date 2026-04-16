---
description: Detect code changes under 2.copilotWebRelay/ and update documentation to keep docs aligned with source code
on:
  push:
    branches: [main]
    paths:
      - "2.copilotWebRelay/**"
      - "!2.copilotWebRelay/docs/**"
  workflow_dispatch:
permissions:
  contents: read
  pull-requests: read
  issues: read
tools:
  github:
safe-outputs:
  create-pull-request:
    title-prefix: "docs(copilotWebRelay): "
    labels: [documentation]
    draft: true
---

# Copilot Web Relay Documentation Sync

You are an AI agent responsible for keeping the documentation under `2.copilotWebRelay/docs/` aligned with the source code under `2.copilotWebRelay/`.

## Your Task

When code changes are pushed to `2.copilotWebRelay/`, analyze the current source code and update the documentation to reflect the actual implementation.

## Steps

1. **Read the source code** under `2.copilotWebRelay/`:
   - `package.json` — Root workspace configuration (npm workspaces: backend + frontend)
   - **Backend** (`backend/`):
     - `backend/src/server.ts` — Express + WebSocket server using `@github/copilot-sdk`
     - `backend/package.json` — Backend dependencies and scripts
     - `backend/tsconfig.json` — TypeScript configuration
   - **Frontend** (`frontend/`):
     - `frontend/src/App.tsx` — Main React chat component (WebSocket client, message rendering, Markdown support)
     - `frontend/src/App.css` — Chat UI styles (dark theme, responsive layout)
     - `frontend/src/main.tsx` — React entry point
     - `frontend/vite.config.ts` — Vite configuration with WebSocket proxy
     - `frontend/package.json` — Frontend dependencies and scripts

2. **Read the existing documentation** under `2.copilotWebRelay/docs/` (if any exists).

3. **Compare and identify discrepancies** between the documentation and the actual source code:
   - Changes to the WebSocket message protocol (message types, formats)
   - Changes to the backend server (Express routes, WebSocket handling, CopilotClient usage)
   - Changes to the frontend React components (state management, UI, event handling)
   - New or modified dependencies
   - Configuration changes (Vite proxy, TypeScript settings)

4. **Update or create documentation files** under `2.copilotWebRelay/docs/`:
   - `2.copilotWebRelay/docs/architecture.md` — System architecture overview (backend/frontend structure, WebSocket communication flow, @github/copilot-sdk integration)
   - `2.copilotWebRelay/docs/api-reference.md` — API reference (HTTP endpoints, WebSocket message protocol with request/response formats)
   - `2.copilotWebRelay/docs/frontend.md` — Frontend documentation (React components, state management, Markdown rendering, CSS theming)
   - `2.copilotWebRelay/docs/setup.md` — Setup and development guide (prerequisites, installation, npm scripts, dev server configuration)

5. **Create a pull request** with the documentation updates using `create-pull-request` safe output.
   - Title: `docs(copilotWebRelay): sync documentation with latest code changes`
   - Body should summarize what documentation was updated and why.

## Guidelines

- Write documentation in Japanese (日本語) to match the existing project documentation style.
- Be precise and factual — only document what the code actually does, not what it should do.
- Include code examples where helpful (e.g., WebSocket message examples, API request/response examples).
- If there are no discrepancies and documentation is up to date, use `noop` to signal no changes needed.
- Do NOT modify any source code — only update documentation files.
- Keep documentation concise and well-structured with clear headings.
