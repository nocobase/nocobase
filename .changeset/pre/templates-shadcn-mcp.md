---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Generated applications configure the shadcn MCP server for Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`) and VS Code (`.vscode/mcp.json`), each running the application's own CLI with `pnpm exec shadcn mcp`, so an agent can search the `@shadcn` and `@nocobase` registries and read an item's example without leaving the editor. Each editor asks for approval the first time. An existing application gets the files through `nocobase-app-upgrade`, which merges them with any server it already configures.
