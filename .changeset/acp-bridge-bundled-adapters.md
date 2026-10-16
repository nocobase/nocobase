---
'@nocobase/acp-bridge': minor
---

The ACP adapters for Codex and Claude Code ship with the bridge, bundled into `dist/adapters/`, and run with the Node.js running the bridge against the `codex` or `claude` installed on the computer (`CODEX_PATH`, `CLAUDE_CODE_EXECUTABLE`), so an agent session no longer waits seconds for npx to start the adapter. The bundled adapter needs Codex 0.160.1 or Claude Code 2.1.200 or newer; with an older agent, or with an agent that is a Windows batch file the adapter cannot start, the bridge falls back to an adapter installed on PATH, then to npx. `NOCOBASE_ACP_ADAPTERS=installed` prefers an adapter installed on PATH over the bundled one. `resolveAgent` takes an optional fourth argument, `ResolveOptions`, and a `ResolvedAgent` may carry the environment its launcher adds.
