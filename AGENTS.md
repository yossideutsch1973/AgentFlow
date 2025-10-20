# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx`, `index.tsx`, and `index.html` compose the Vite/React entry points.
- `components/` holds UI primitives such as `WorkflowEditor` and node-specific panels; match existing naming when adding new views.
- `services/` contains client-side utilities for executing, storing, and validating workflows. Extend these modules instead of duplicating logic.
- `types.ts` centralizes shared TypeScript definitions; add new workflow shapes there to keep type usage consistent.

## Build, Test, and Development Commands
- `npm install` – bootstrap dependencies before any local work.
- `npm run server` – start the Express API on port 4000 (required for secure LLM/Search/HTTP calls).
- `npm run dev` – launch the Vite dev server with hot module reload (port 3000, proxying `/api` to the backend).
- `npm run dev:full` – run frontend and backend together for everyday development.
- `npm run build` – produce the optimized production bundle in `dist/`.
- `npm run preview` – serve the production build locally for sanity checks.
- `npm test` – execute Vitest unit tests for validators/execution helpers; add specs when you touch workflow logic.

## Coding Style & Naming Conventions
- Follow the current TypeScript/React style: 4-space indentation, single quotes, and explicit `import` paths relative to `src` root.
- Prefer functional components with hooks; colocate related helpers within the component file when scope is limited.
- Use descriptive IDs for workflow nodes (`verb_entity`), and keep enums/consts in `types.ts`.
- Run a quick `npm run build` before committing to surface TypeScript errors, since no formatter is enforced yet.

## Testing Guidelines
- Keep Vitest coverage current for core logic (`services/`). Place specs in `__tests__/` folders and name files `<module>.test.ts`.
- For UI changes without automated coverage, document manual validation steps in the PR description.

## Commit & Pull Request Guidelines
- Use present-tense, concise commit messages (`Add workflow sidebar persistence`). Squash fixups before pushing.
- Reference related issues in the PR description and include screenshots or screencasts for UI-visible changes.
- Confirm the PR checklist: dependencies installed, `npm run build` passes, and `.env.local` secrets are excluded from commits.

## Security & Configuration Tips
- Store API keys (e.g., `GENAI_API_KEY`) in `.env.local`; the file is git-ignored. Never commit secrets or rotate keys without notifying maintainers.
- `LLM_PROVIDER` controls the backend default; `VITE_LLM_PROVIDERS` (comma-separated) feeds the UI dropdown. Keep these values in sync when adding a new adapter.
- When sharing reproducible environments, document required env vars in the PR so reviewers can mirror your setup quickly.
