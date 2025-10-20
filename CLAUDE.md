# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

AgentFlow UI is a visual workflow designer for AI-powered flows. The application uses a client-server architecture where:
- The **React frontend** (Vite dev server on port 3000) provides a ReactFlow-based visual canvas for building workflows
- The **Node/Express backend** (port 4000) proxies LLM calls, Google Search, and HTTP requests to keep API keys server-side

The workflow execution model is **graph-based**: nodes represent operations (INPUT, CONST, LLM, HTTP, SEARCH, MAP, IMAGE, OUTPUT), and edges represent data dependencies. The executor resolves nodes in topological order when all dependencies are satisfied.

### Key Architectural Patterns

**1. Operation Catalog (`operations/catalog.tsx`)**
- Centralized registry of all node types with UI metadata (icons, colors, input handles, defaults)
- Adding a new node type requires updating this catalog to define its appearance and interface
- Each operation specifies `inputHandles` (what can connect to it) and `defaultParams`

**2. Workflow Storage (`services/workflowStorage.ts`)**
- Workflows persist to `localStorage` keyed by user email: `agentflow_workflows_${email}`
- Each workflow has an ID, name, and array of `FlowNode` objects with positions and connections
- Multi-device sync is not supported; export/import JSON for sharing

**3. Workflow Execution (`services/workflowExecutor.ts`)**
- Implements a dependency-resolution algorithm that evaluates nodes when inputs are ready
- Uses `OperationAdapters` to abstract API calls (LLM, search, HTTP) for easier testing
- Execution context (`Map<NodeId, any>`) accumulates results; OUTPUT nodes reference this context

**4. Provider Abstraction (`server/providers/`)**
- LLM providers implement the `LLMProvider` interface (`types.ts`)
- Default provider is Google (`google.ts`), configured via `GENAI_API_KEY`
- To add a new provider: implement `invokeLLM()` and optionally `invokeSearch()`, then register in `index.ts`
- Frontend specifies provider per-node via the `provider` param; backend resolves to registered adapter

**5. Type System (`types.ts`)**
- `FlowNode`: UI representation with `position`, `op`, `inputs`, `params`
- `WorkflowIR`: intermediate representation for export/import (not yet fully utilized for execution)
- `StoredWorkflow`: persistence format with ID and node array

### Component Hierarchy

```
App.tsx
├─ Header (user profile, sign-out)
├─ Sidebar (workflow list, create/delete)
└─ WorkflowEditor
   ├─ WorkflowControls (name, save, delete, export/import JSON)
   ├─ WorkflowCanvas (ReactFlow wrapper)
   │  └─ CustomNode (renders nodes using operation catalog metadata)
   └─ RunControlsAndOutput (execute workflow, display results)
```

## Development Commands

**Full-stack development:**
```bash
npm run dev:full    # runs both server and frontend concurrently
```

**Start services independently:**
```bash
npm run server      # backend only (port 4000)
npm run dev         # frontend only (port 3000, proxies /api to backend)
```

**Build and test:**
```bash
npm run build       # produces dist/ for production
npm test            # runs Vitest specs in services/__tests__/
```

## Configuration

Create `.env.local` with:
```
GENAI_API_KEY=your_google_ai_studio_key
VITE_API_BASE_URL=/api
LLM_PROVIDER=google
VITE_LLM_PROVIDERS=google
VITE_DEFAULT_LLM_PROVIDER=google
```

- `LLM_PROVIDER`: backend default when no provider is specified in workflow node params
- `VITE_LLM_PROVIDERS`: comma-separated list for the UI dropdown (must match registered providers)
- `VITE_API_BASE_URL`: relative path for API calls (Vite proxy rewrites `/api` to `http://localhost:4000`)

## Testing Guidelines

- Place specs in `services/__tests__/` with `.test.ts` suffix
- Use `createOperationAdapters()` from `workflowExecutor.ts` to mock LLM/search/HTTP in tests
- Coverage exists for `workflowValidator.test.ts` and `workflowExecutor.test.ts`
- When adding new operations or validators, add corresponding test cases

## Adding a New Node Type

1. Add the enum value to `OpType` in `types.ts`
2. Define the operation in `operations/catalog.tsx`:
   - Specify `label`, `icon`, `paletteClasses`, `nodeBorderClass`
   - List `inputHandles` and `defaultParams`/`defaultInputs`
3. Update execution logic in `services/workflowExecutor.ts` (add a case in the `switch (node.op)` block)
4. Add validation rules in `services/workflowValidator.ts` if needed
5. Write unit tests for the new operation

## Adding a New LLM Provider

1. Create a provider file in `server/providers/` (e.g., `openai.ts`)
2. Implement the `LLMProvider` interface:
   - Required: `name`, `invokeLLM()`
   - Optional: `supportsSearch`, `invokeSearch()`
3. Register the provider in `server/providers/index.ts` via `setProvider()` or update `registerDefaultProviders()`
4. Update `.env.local` to include the new provider in `VITE_LLM_PROVIDERS`
5. Configure any necessary API keys or environment variables

## Coding Conventions

- **Indentation:** 4 spaces (not enforced by formatter; follow existing style)
- **Imports:** Use `@/` alias for absolute imports from project root
- **TypeScript:** Enable strict mode; avoid `any` except in error handlers
- **React:** Functional components with hooks; avoid class components
- **Node IDs:** Use descriptive snake_case (e.g., `vision_llm`, `search_results`)

## Common Pitfalls

- **Missing API key:** Backend warns if `GENAI_API_KEY` is unset; Google provider calls will fail at runtime
- **Provider mismatch:** If `VITE_LLM_PROVIDERS` lists a provider not registered server-side, execution fails with "provider not registered"
- **Circular dependencies:** Workflow executor detects cycles and throws `WorkflowExecutionError` if nodes cannot resolve
- **Image input format:** LLM nodes expect base64 data URLs (`data:image/png;base64,...`); other formats throw errors
- **localStorage scope:** Workflows are isolated per user email; logging out clears the active session but not `localStorage`

## AI Studio Integration

The app includes mock implementations for the `window.aistudio` API (used when embedded in Google AI Studio):
- `App.tsx:46-86` provides fallback auth and quota methods for standalone dev
- Real AI Studio environment will override these mocks with actual implementations
- User profiles persist to `localStorage` under key `userProfile`

## References

- See `README.md` for setup and workflow overview
- See `AGENTS.md` for contributor guidelines and commit conventions
