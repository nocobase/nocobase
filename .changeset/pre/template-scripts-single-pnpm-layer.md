---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Run the CLI-backed package scripts through `tsx ./cli/index.ts` directly instead of through `pnpm nocobase`.

`db:apply`, `db:reset`, `db:repair`, `collections:generate`, and Default's `upload` and `deploy` were each defined as `pnpm nocobase app <command>`, so running one started a second `pnpm run` inside the first. Both layers report a failure, which turned the single intended non-zero exit of `collections:generate --check` into two `ELIFECYCLE` lines and made it read as two failures. Each script now names the entry point it runs, and `pnpm nocobase <topic>` remains the way to reach a command that has no script of its own.
