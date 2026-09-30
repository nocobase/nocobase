---
'@nocobase/create-app': patch
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
---

Stop running the `better-sqlite3` install script in generated applications and deployment output. The driver ships prebuilt binaries for Linux (glibc and musl), macOS and Windows on x64 and arm64, so its `node-gyp rebuild` compiled nothing on those platforms, yet it failed the whole install on a machine without `make`, such as a slim Node.js container. `allowBuilds` now records it as `false`. After installing, `create-app` no longer runs `pnpm rebuild` when the driver fails to load, because that rebuild skips a package whose build is skipped; it reports the platform instead, with how to compile the driver there.
