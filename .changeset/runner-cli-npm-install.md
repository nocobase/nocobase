---
'@nocobase/agent-runner': minor
'@nocobase/app-cli-client': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/studio-cli': patch
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
'@nocobase/studio': patch
---

The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

`@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

`nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.
