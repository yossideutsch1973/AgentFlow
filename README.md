# AgentFlow UI

AgentFlow UI is a Vite + React application for designing, validating, and executing AI workflows via an interactive canvas. It ships with a lightweight Node/Express API so LLM keys stay server-side while the browser orchestrates flows.

## Highlights
- Visual workflow builder using ReactFlow with nodes for inputs, constants, HTTP calls, Gemini LLM invocations, Google Search, and outputs.
- Real-time validation plus JSON IR export and execution status feedback.
- Secure backend proxy for Gemini and outbound HTTP so secrets remain off the client and CORS issues are centralized.
- Shared operation catalog describing node metadata, enabling consistent UI, defaults, and easier extension.
- Provider-agnostic LLM plumbing: choose a provider per node (defaults to Google) and bind new adapters server-side without touching the UI.

## Setup
```bash
npm install
```
Create `.env.local` with:
```
GENAI_API_KEY=your_google_ai_studio_key
VITE_API_BASE_URL=/api            # keep relative when using the dev proxy
LLM_PROVIDER=google               # backend default provider
VITE_LLM_PROVIDERS=google         # comma-separated provider list for the UI dropdown
VITE_DEFAULT_LLM_PROVIDER=google  # frontend fallback provider
```

## Development Workflow
- `npm run dev:full` – runs the Express API on `http://localhost:4000` and Vite dev server on `http://localhost:3000` with `/api` proxied to the backend.
- `npm run server` / `npm run dev` – start backend and frontend independently.
- `npm run build` – create a production bundle in `dist/`; serve that bundle alongside the API server (`npm run server`).

## Testing
Vitest powers unit tests for validators and execution logic:
```bash
npm test
```
Add future specs under `__tests__/` to cover new operations or adapters.

## Project Structure
- `App.tsx`, `components/`, `services/` – React entry point, UI primitives, workflow storage/execution utilities.
- `operations/` – central registry describing node UI metadata and defaults.
- `server/` – Express API relaying Gemini LLM/Search and HTTP calls.
- `types.ts` – shared TypeScript contracts for nodes and workflow IR.
- `AGENTS.md` – contributor guidelines and coding conventions.

## Security Notes
- Keep `GENAI_API_KEY` out of git; the `.env.local` template is ignored by default.
- Workflows persist in `localStorage`. Export/import or integrate a backend store if you need multi-device access.

See `AGENTS.md` for contributor expectations, commit etiquette, and review checklist. PRs that introduce new node types should update the operation catalog and add Vitest coverage for validation/execution flows.
