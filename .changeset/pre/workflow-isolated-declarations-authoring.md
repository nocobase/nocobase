---
'@nocobase/app-plugin-dag-flow': patch
---

Teach and verify workflow authoring under the application's `isolatedDeclarations` server typecheck: bind `defineWorkflow()` to a `WorkflowSourceAst`-annotated const before default-exporting it instead of default-exporting the call directly, and compile the skill-eval workflow fixtures under that contract in `pnpm typecheck`. Also drop the stale `.agents` entry from the published `files` allowlist — the workflow skill ships under `skills/` and the plugin has no `.agents` directory.
