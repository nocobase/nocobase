# @nocobase/app-cli-client

## 0.1.0-beta.2

### Minor Changes

- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

### Patch Changes

- 459c33f: `nocobase cli build --universal` packs the application's CLI, or with `--runner` the runner, into one platform-independent tarball, `<product>-v<version>-universal.tar.gz`, that carries no Node.js and runs on the machine's own Node.js 24 or newer; without `--targets` it is the only tarball packed. Its launcher runs on `NOCOBASE_NODE`, the installation's `<prefix>/node`, `node` on PATH, or the Node a previous standalone version of the installation still carries, so a runner's user service, whose PATH usually has no `node`, keeps starting.

  The agents plugin serves that tarball to every platform without a tarball of its own (one built for the platform still wins) and marks the answer with `universal: true` (`universal=true` with `format=env`); answers for platform tarballs are unchanged. For a universal tarball the install script checks that `node` is Node.js 24 or newer before downloading, stops with how to install it otherwise, and links `<prefix>/node` to it; with `--runner` it prints a `corepack enable` hint when `pnpm` is missing. The "Add runtime" dialog says the host needs Node.js 24 or newer.

  An update of an installed CLI or runner to a version without a bundled Node (`applyUpdate` of `@nocobase/app-cli-client/install`) first leaves the Node it runs on in `<prefix>/node` (`pinNode`), copied when it is a Node an older version bundles, so a runner that updates itself from a standalone version keeps a Node after the old versions are removed.

- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [97bd30b]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3

## 0.1.0-beta.1

### Patch Changes

- a6758ec: Point published package repository metadata to nocobase/nocobase while preserving each package's monorepo directory.

## 0.1.0-beta.0

### Minor Changes

- 37c8d20: Add `@nocobase/app-cli-client`, a command line for a NocoBase application branded by the application: it signs in to a server (browser device login, an API key, or a run's credential), stores credentials in the operating system's keychain, and runs the business commands the server's command manifest (`GET /api/cli/manifest`) publishes for the caller, each a request to one API route, with `--json` output in the shared envelope. An application declares its brand under `nocobase.cli` in its `package.json`, and `nocobase cli build` and `nocobase cli link` of `@nocobase/app-cli` package it; `runAppCli` serves a CLI that adds static commands of its own. `./request` (`fillRequest`), `./parse` and `./install` expose the request builder, the command-line parser and the install layout to servers and installers.

### Patch Changes

- Updated dependencies [37c8d20]
  - @nocobase/agent-protocol@0.1.0-beta.0

## 0.0.1

Initial version.
