# Repository Layout and Repository Skills

Read this before adding a package, deciding which directory a package belongs in, or adding or editing a Skill under `skills/`.

## Repository Layout

Every published package lives under `packages/`, grouped into seven directories by what the package is. The grouping is a convention for readers: pnpm resolves packages by name, so which directory a package sits in changes nothing about how it is depended on or filtered.

| Directory             | What belongs here                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `packages/libs/`      | Runtime libraries that solve one problem and know nothing about NocoBase applications, such as `caching`, `drive`, and `i18n` |
| `packages/app/`       | The application runtime itself — what an application is built out of, such as `app-server`, `app-client`, and `app-cli`       |
| `packages/plugins/`   | Application plugins that ship as product features, such as `app-plugin-authentication`                                        |
| `packages/examples/`  | Application plugins that exist to demonstrate a capability, such as `app-plugin-routes-example`                               |
| `packages/templates/` | Complete applications that `create-app` scaffolds from: `app-template-default` and `app-template-examples`                    |
| `packages/apps/`      | Complete product applications this repository builds and deploys itself; none at present                                      |
| `packages/tools/`     | Development and build tooling that never ships inside an application, such as `dev-config`, `create-app`, and `create-plugin` |

`packages/README.md` describes each directory in more detail and is the place to look when a new package does not obviously belong to one of them. `pnpm plugin:create` scaffolds into `packages/plugins/`.

`docs/` and `ui-library/` are private workspace members outside `packages/`. The plugin Skill's private executable fixture is nested at `packages/app/app-skills/skills/nocobase-app-plugin-development/assets/testing-example/` and explicitly listed in `pnpm-workspace.yaml`; it is not a separately published package. Package discovery checks the `packages/<category>/<package>` level. The fixture's source and verifier ship as Skill resources, excluding generated output and installed dependencies.

## Repository Skills

Global entry Skills are committed under root `skills/`. Complete App guidance is maintained in `packages/app/app-skills/skills/` and published with `@nocobase/app-skills`. `pnpm install` runs `scripts/sync-skills.mjs`, which links root entry Skills into `.agents/skills/` and `.claude/skills/`, except that `nocobase-app-plugin-development` links directly to its complete package source. Both Agent directories are generated and ignored. The same-named root directory is only a migration bridge for old global installations; never link it as this repository's implementation guide. Source-only plugin conventions live in [plugin-development.md](plugin-development.md).

Keep relative links within a Skill. Refer to optional repository files by paths from the repository root in code spans, because a Skill can be read through links or copied into an App. Apps do not require a NocoBase source checkout.

`nocobase-create-app` and `nocobase-app-installer` are the global entry points: the first creates a project to develop, the second installs a built deployment archive locally or over SSH. Install them by explicit name from `nocobase/skills-v3`; do not recommend `--skill '*'`, which also selects the legacy plugin bridge. See [skills/README.md](../../skills/README.md) for installation and unreleased validation.

Root `skills/` changes reach the distribution repository when merged, independently of npm releases. A global entry must not assume an unpublished package feature is available. The plugin migration bridge probes for the project replacement and keeps older installations intact until a compatible release exists. Full project guidance ships in npm packages with changesets; synchronize it from the App's compatible installed dependencies, never by editing generated copies.

`nocobase-app-development`, `nocobase-app-upgrade` and `nocobase-deployment` are App-only Skills and are not linked into the source repository. Plugin development guidance is the explicit shared exception. Generated Apps copy installed package Skills into `.agents/skills/` and mirror them through relative links in `.claude/skills/`. The exact `nocobase-app-plugin-development` name belongs only to `@nocobase/app-skills`; other `nocobase-app-plugin-*` names retain their plugin ownership rules.

The repository sync preserves real local directories and removes stale symbolic links without following their targets. It never edits user-global installations. Run `node scripts/sync-skills.mjs` after changing Skill sources or links. When a target App release includes the project plugin Skill, its upgrade guidance verifies synchronization before retiring the old global copy, preserving custom content and recording recovery outside the App's Git rollback.
