# @nocobase/studio

## 1.0.0-beta.52

### Minor Changes

- 40a5679: An application can name the runner and its CLI on npm when it has no tarball of them. `agents.dist.npm` maps a product to its npm package and an exact version, such as `{ nocobase-runner: { package: '@nocobase/agent-runner', version: '1.0.0' } }`; a product `agents.dist.dir` has a current version of is still served from there exactly as before. Only callers that say they understand the answer receive it: the resolve route (`/api/agents/dist/products/<product>/targets/<target>`) answers `{ kind: 'npm', product, version, package, channel }` (or `kind=npm` lines with `format=env`) to a request with `accept=npm`, and a heartbeat answer carries `npmUpgrade` instead of `upgrade` only to a runner that declares the new `npm` feature. Every other caller gets what it got before: the artifact when there is a tarball, otherwise a 404 and no update.

  `@nocobase/agent-protocol` adds `DistNpmPackage`, `DistResolution`, `DIST_ACCEPT_NPM`, `NpmUpgradeNotice`, `HeartbeatResponse.npmUpgrade` and the `npm` runner feature (`NPM_UPGRADE_FEATURE`), and moves `PROTOCOL_VERSION` to 8 so that a runner announcing `npm` is refused cleanly by a server that does not know it. Nothing of protocol 7 changed: a server speaking 8 still serves runners speaking 3 to 7. A runner speaking 8 is shown as needing an upgrade by an application that serves only up to 7, so upgrade the application before its runners.

  NocoBase Studio pins the runner it serves to the exact `@nocobase/agent-runner` version it was built with, recorded by `pnpm build` in `dist/server/agents/served-versions.json` (the runner stays out of the deployment's dependencies), and names it on npm when its image carries no runner tarballs. Redeploying Studio moves runners that understand npm updates to that version.

- d3763a2: Studio's `pnpm build` now packs the universal `nocobase-runner` and `nb-studio` packages into `dist/runners/`, at the exact versions it records in `dist/server/agents/served-versions.json` (`nb-studio` at `@nocobase/studio-cli`'s version, the runner at `@nocobase/agent-runner`'s), and fails when they differ. Studio serves them from there by default, so every build, deployment archive and image serves the runner and CLI it was built with, including to runners installed from a package, which can only update from one. `agents.dist.dir` in `config.yml` and `NB_STUDIO_RUNNERS_DIST` still take precedence, and npm stays the fallback for a Studio without packages, such as `pnpm dev`. The build installs the packages' dependencies with npm, so it needs access to the npm registry. The Dockerfile no longer takes a `runners-dist/` directory, and it rejects a prebuilt `dist/` without `dist/runners`. The published package now includes `ai/`, the Skills `nb-studio` ships, which an installed Studio needs to pack it.

  `nb-studio` packages are now versioned as `@nocobase/studio-cli` rather than as Studio. An installation that served `nb-studio` packed with `pnpm nocobase cli build` and no `--version` handed out Studio's version, which sorts higher, so `nb-studio update` does not offer the new package there: install `nb-studio` again with the install script.

  The agents plugin's documentation describes building the runner and CLI into an application's own build output as an alternative to separate CI artifacts.

  `@nocobase/studio-cli` now shares Studio's version line (a `fixed` changesets group), so the `nb-studio` Studio serves keeps the versions earlier Studio builds handed out and `nb-studio update` offers it to existing installations.

### Patch Changes

- 91f5344: Allow applications to opt coding runs into verified empty-repository initialization. Prepare the default branch without a seed commit, report the first-delivery instructions, and guard its push against updating an existing remote branch. Keep missing branches in populated repositories as checkout failures.
- 13620d9: The runner and an application's CLI can now be installed and updated from npm when the application serves no tarball of them and names the exact npm version instead (`agents.dist.npm`). The install script asks with `accept=npm`; for an npm answer it checks for Node.js 24 or newer and `npm` (or `NOCOBASE_NPM`), runs `npm install --prefix <prefix>/versions/<version> --no-save --no-audit --no-fund --omit=optional <package>@<version>` and writes a launcher at `versions/<version>/bin/<command>`, so `current`, the linked command and the runner's user service work as they do for a tarball, and links `<prefix>/node` to the Node.js it checked. The runner declares the `npm` feature and installs a heartbeat's `npmUpgrade` the same way between runs; `nocobase-runner update` and `<cli> update` follow either answer, and an installation moves between tarball and npm versions in both directions (`installNpmVersion`, `npmLauncherScript` and `UpdateTarget` in `@nocobase/app-cli-client/install`). An application that answers no npm form is handled exactly as before.

  `@nocobase/agent-runner` and `@nocobase/app-cli-client` now depend on exactly the `@nocobase/agent-protocol` they were built with, and `@nocobase/studio-cli` and `@nocobase/agent-runner` on exactly their `@nocobase/app-cli-client`, so a version installed from npm behaves as it was built.

  `nocobase skills sync` no longer reads Skills from a packaged application CLI (a dependency declaring `nocobase.cli`, such as `@nocobase/studio-cli`): its `skills/` is for that command's users. NocoBase Studio declares `@nocobase/studio-cli`, so its build pins `nb-studio` to the version it was built with, and its CLI documentation and home-page agent prompt say that `nb-studio` needs Node.js 24 or newer with npm. The application development Skill documents `nocobase cli build --universal`.

- d3f6672: A new migration, `202610220020_studio_rename_activity_namespace`, moves the i18n namespace of the owner notices workflows already recorded (`owner_notified` activities) from `studio` to `@nocobase/studio`, so the inbox and an issue's recent activity keep showing them translated.
- d54bae6: Route recognized issue and project links in chat Markdown through the application router, preserving deployment prefixes, queries and fragments while retaining external-link behavior and URL sanitization.
- 0cc0327: NocoBase Studio moves into this repository at `packages/apps/studio` and is published as `@nocobase/studio`. A new migration, `202610220010_studio_rename_package`, moves the migration and seed history Studio recorded under its former package name `studio` to `@nocobase/studio`, and rewrites the i18n namespace of workflow definitions copied from its software template; installations upgrade with `nocobase db apply` as usual.
- 4a11ee5: Clarify the local Coding Agent setup entry and instructions, including the nb-studio command, browser sign-in confirmation, identity and permission checks, and the separate Runner setup flow.
- af938d0: Show a setup hint when the selected home-page Runner Agent has no eligible runtime. Refresh availability while preserving the selected Agent, message draft and ability to queue messages.
- Updated dependencies [40a5679]
- Updated dependencies [91f5344]
- Updated dependencies [17a183c]
- Updated dependencies [9d28d61]
- Updated dependencies [13620d9]
- Updated dependencies [97bd30b]
- Updated dependencies [d3763a2]
- Updated dependencies [459c33f]
  - @nocobase/agent-protocol@0.1.0-beta.3
  - @nocobase/app-plugin-agents@0.1.0-beta.5
  - @nocobase/app-cli@1.0.0-beta.18
  - @nocobase/app-plugin-authentication@2.0.0-beta.4

## 1.0.0-beta.51

Imported from nocobase/studio at e4a18fd.
