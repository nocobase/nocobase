---
'@nocobase/app-cli': minor
'@nocobase/agent-protocol': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/app-cli-client': patch
---

`nocobase cli build --universal` packs the application's CLI, or with `--runner` the runner, into one platform-independent tarball, `<product>-v<version>-universal.tar.gz`, that carries no Node.js and runs on the machine's own Node.js 24 or newer; without `--targets` it is the only tarball packed. Its launcher runs on `NOCOBASE_NODE`, the installation's `<prefix>/node`, `node` on PATH, or the Node a previous standalone version of the installation still carries, so a runner's user service, whose PATH usually has no `node`, keeps starting.

The agents plugin serves that tarball to every platform without a tarball of its own (one built for the platform still wins) and marks the answer with `universal: true` (`universal=true` with `format=env`); answers for platform tarballs are unchanged. For a universal tarball the install script checks that `node` is Node.js 24 or newer before downloading, stops with how to install it otherwise, and links `<prefix>/node` to it; with `--runner` it prints a `corepack enable` hint when `pnpm` is missing. The "Add runtime" dialog says the host needs Node.js 24 or newer.

An update of an installed CLI or runner to a version without a bundled Node (`applyUpdate` of `@nocobase/app-cli-client/install`) first leaves the Node it runs on in `<prefix>/node` (`pinNode`), copied when it is a Node an older version bundles, so a runner that updates itself from a standalone version keeps a Node after the old versions are removed.
