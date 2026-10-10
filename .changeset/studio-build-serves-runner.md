---
'@nocobase/studio': minor
'@nocobase/app-plugin-agents': patch
---

Studio's `pnpm build` now packs the universal `nocobase-runner` and `nb-studio` packages into `dist/runners/`, at the exact versions it records in `dist/server/agents/served-versions.json` (`nb-studio` at `@nocobase/studio-cli`'s version, the runner at `@nocobase/agent-runner`'s), and fails when they differ. Studio serves them from there by default, so every build, deployment archive and image serves the runner and CLI it was built with, including to runners installed from a package, which can only update from one. `agents.dist.dir` in `config.yml` and `NB_STUDIO_RUNNERS_DIST` still take precedence, and npm stays the fallback for a Studio without packages, such as `pnpm dev`. The build installs the packages' dependencies with npm, so it needs access to the npm registry. The Dockerfile no longer takes a `runners-dist/` directory, and it rejects a prebuilt `dist/` without `dist/runners`. The published package now includes `ai/`, the Skills `nb-studio` ships, which an installed Studio needs to pack it.

`nb-studio` packages are now versioned as `@nocobase/studio-cli` rather than as Studio. An installation that served `nb-studio` packed with `pnpm nocobase cli build` and no `--version` handed out Studio's version, which sorts higher, so `nb-studio update` does not offer the new package there: install `nb-studio` again with the install script.

The agents plugin's documentation describes building the runner and CLI into an application's own build output as an alternative to separate CI artifacts.
