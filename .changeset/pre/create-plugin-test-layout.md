---
'@nocobase/create-plugin': minor
---

Generated plugins group their tests by the source directory they cover: `tests/client/`, `tests/server/`, `tests/database/` and `tests/cli/`, with `vitest.config.ts` choosing jsdom or Node by directory. The sample tests move and are renamed accordingly (`tests/database.test.ts` is now `tests/database/migrations.test.ts`, `tests/cli.test.ts` is `tests/cli/info.test.ts`). A plugin without client code now gets a `vitest.config.ts` too, running its tests on the shared Node preset, whose 30-second timeouts replace Vitest's 5-second default. The generated `AGENTS.md` describes the layout. The JSON plan now attributes `cli/` files and the database test to their `cli` and `database` capabilities. Existing plugins are unaffected.
