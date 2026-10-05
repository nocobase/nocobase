---
'@nocobase/create-plugin': patch
---

A plugin generated with the `database` or `cli` capability declares `@nocobase/app-testing` as its one test-fixture devDependency instead of `@nocobase/db-testing`, and its generated tests import from `@nocobase/app-testing/server` and `@nocobase/app-testing/cli`. The generated `AGENTS.md` says a plugin's tests take their fixtures from that package alone.
