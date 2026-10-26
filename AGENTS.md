# AGENTS.md

This is the NocoBase 3 source repository. Ignore globally installed NocoBase 2 Skills here; follow the nearest `AGENTS.md` and repository-local NocoBase 3 Skill instead.

## Root README Policy

Do not add content to the repository root `README.md`. Record repository development rules in `AGENTS.md` and put detailed usage documentation in dedicated documentation files. Do not refill an empty root README as part of documenting a change.

## Application Access URLs

When reporting a running application's address or opening it for the user, use its application entry URL. In normal full-stack development, the Hono server proxies Vite, so the user-facing URL uses the server port (`APP_SERVER_PORT`, default 13000), including the application's base path. Vite's port (normally 5173) serves the frontend development process and is not the user-facing application entry. This applies to every application, including the templates.

Prefer the `Local:` URL printed by `pnpm dev`. For an existing run without available startup output, identify the application's process and working directory, confirm its actual server listening port and configured base path, and check the resulting URL before sharing it. Ports can advance when occupied; never infer the entry URL from defaults or a successful response on the Vite port alone. Report which checkout owns the run when it differs from the current workspace. Use a host reachable by the user; `localhost` refers to the machine where the browser runs.

The exception is remote-backend proxy development (`PROXY_TARGET_URL`): no local Hono server runs, and the local Vite process is the application entry. In that mode, use the printed `Local:` URL; `APP_SERVER_PORT` selects that local entry port (default 5173).

## Markdown Paragraph Formatting

Write each prose paragraph in Markdown source on a single physical line, including in README, AGENTS.md, Skills, and other documentation. Do not insert manual line breaks to fit a column width or put each sentence on its own line; let the editor or renderer wrap the text visually. Separate paragraphs with blank lines. Preserve line breaks required by Markdown structure, such as headings, list items, tables, blockquotes, and code blocks.

## Keeping This File Small

This file stays at most 32 KB and must not grow without bound, because every agent loads it on every start. It holds only the rules an agent must follow before opening anything else, each in a few sentences, and an index of where the detail lives. Detailed guidance lives in `.agents/rules/<topic>.md`: when a change needs its documentation updated, update the relevant rules file, or add one, and add or update its entry in the index below rather than writing the detail here. `pnpm agents:check` enforces the size limit and checks that every link into `.agents/rules/` resolves.

## Branches, Commits and Pull Requests

Name a branch `<type>/v3-<name>` after its Conventional Commits type, such as `feat/v3-app-installer` or `fix/v3-<name>`. Never push a branch under a tool's own prefix, such as `claude/` or `codex/`: rename it with `git branch -m` before its first push, because renaming it once a pull request is open closes that pull request. Studio's `agent/<issue key>` branches are the exception. Commit messages and pull request descriptions carry no attribution to an AI tool: no `Co-Authored-By` trailer naming a model or an agent, and no "Generated with …" line. Details: [.agents/rules/pull-requests-and-changesets.md](.agents/rules/pull-requests-and-changesets.md).

## Pull Request Descriptions and the Changelog

Every pull request into `v3-develop`, `v3-main` or a branch based on them (`*/v3-*`) follows `.github/pull_request_template.md` on `v3-develop`, whichever tool opens it; GitHub's web form offers the v2 template from `main`, whose type list and Changelog table parse the same way. Check exactly one type. New feature, Improvement and Bug fix need one user-facing sentence in English and one in Chinese in the Changelog table; Others (tests, CI, scripts, documentation, refactors nobody notices) leaves it empty. The title's scope names the module through `scripts/changelog-scopes.json`. The `PR description` check enforces this, and the release workflows build the root `CHANGELOG.md`, `CHANGELOG.zh-CN.md` and the GitHub Release from these sections. Details: [.agents/rules/pull-requests-and-changesets.md](.agents/rules/pull-requests-and-changesets.md#pull-request-descriptions-and-the-changelog).

## Before Creating or Updating a Pull Request

Read [.changeset/README.md](.changeset/README.md) first. A pull request that changes a publishable package's published output includes a changeset covering every affected package; `AGENTS.md`, `CLAUDE.md` and `skills/` inside a package count as published output. Run `node scripts/validate-changesets.mjs` before pushing, and run the CI check locally:

```bash
BASE_SHA=$(git merge-base origin/v3-develop HEAD) HEAD_SHA=$(git rev-parse HEAD) \
  node scripts/require-changesets.mjs
```

A new changeset goes in `.changeset/`, never in `.changeset/pre/`, which the changesets tool owns; a file written there is silently ignored. A change that genuinely should not be released takes the `release:skip` label with the reason in the description. While `v3-develop` is in prerelease mode a `major` changeset cannot move an `X.0.0-beta.N` package; see [.agents/rules/pull-requests-and-changesets.md](.agents/rules/pull-requests-and-changesets.md) for what to do instead.

## V3 Workflow Synchronization

Executable workflow YAML stays directly in `.github/workflows/`, and every v3 workflow filename starts with `v3-`. Every v3 workflow change includes a synchronization check of its corresponding entry on `main`; additions, deletions, renames, dispatch input changes and trigger changes update that entry in the same delivery. The Quality checks have no workflow here: they are defined in `chenos/nocobase-ci`. Details: [.agents/rules/workflows-and-release.md](.agents/rules/workflows-and-release.md).

## Validation

Run `lint`, `typecheck`, `test` and `build` for the packages you modified and for the packages that consume what you changed, scoped with `pnpm --filter <package>`. A workspace-wide `pnpm -r test` is CI's job, not a routine step after an edit; widen the scope only when the change reaches further, such as an exported type, a shared configuration preset, or anything a generated application depends on. Prefer `pnpm fix` after editing code. Details: [.agents/rules/testing.md](.agents/rules/testing.md).

Run database integration suites one at a time locally, through the package that owns them (`pnpm --filter @nocobase/db-<dialect> test:integration`); never start two at once or leave one in the background. Details: [.agents/rules/database-integration-tests.md](.agents/rules/database-integration-tests.md).

## Rules That Are Easy to Break

- **Migrations are immutable once merged.** A migration merged into its target branch is never edited again, not its operations, its `down`, its name or its filename, and not even to reformat it; every correction is a new migration. Migrations are self-contained and never import live collection definitions. Details: [.agents/rules/database-migrations.md](.agents/rules/database-migrations.md).
- **Identity-sensitive packages are peers.** A plugin declares the runtime it plugs into, and every package listed in `IDENTITY_SENSITIVE_PACKAGES` in `scripts/check-peer-deps.mjs`, as a `peerDependency`, never as a `dependency`; `pnpm peers:check` enforces it. Details: [.agents/rules/package-dependencies.md](.agents/rules/package-dependencies.md).
- **Declare dependencies by who resolves them.** Ordinary server imports go in `dependencies`, client value imports in `peerDependencies`, and tests, build tooling and type-only imports absent from published declarations in `devDependencies`. Details: [.agents/rules/package-dependencies.md](.agents/rules/package-dependencies.md) and [.agents/rules/native-dependencies-and-builds.md](.agents/rules/native-dependencies-and-builds.md).
- **Keep the application templates in sync.** A framework-layer change to one of `packages/templates/app-template-default` and `packages/templates/app-template-examples` belongs in all applicable templates in the same change. Details: [.agents/rules/templates.md](.agents/rules/templates.md).
- **Tests never assert a workspace package's own version as a literal**; read it from the manifest. Details: [.agents/rules/testing.md](.agents/rules/testing.md).
- **Every `/api` route follows the HTTP API specification and declares itself for the API document.** Details: [.agents/rules/http-api.md](.agents/rules/http-api.md).

## Language

Anything a person outside the team can read is written in English. Anything only the team reads may be written in Chinese.

Write in English:

- Commit messages and pull request titles
- Code comments, including comments in workflow files
- Identifiers, log output, and error messages
- Changeset summaries — they are copied verbatim into the published CHANGELOG
- Everything a GitHub Actions run produces that a contributor sees: `workflow_dispatch` input descriptions, job and step names, job summaries, `::error` and `::warning` annotations, and the body of any pull request the workflow opens

Chinese is fine for:

- Feishu notification titles and bodies, which only reach an internal group

The distinction is the audience, not the file type. A comment inside a workflow is read by maintainers and stays English along with the rest of the code; the Feishu message that same workflow sends never leaves the team, so it stays Chinese.

The workflow files under `.github/workflows/` still carry Chinese comments written before this rule existed. Translate the ones you touch; there is no need to convert the rest in a single pass.

## Index

| Read                                                                                               | When                                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [.agents/rules/pull-requests-and-changesets.md](.agents/rules/pull-requests-and-changesets.md)     | Naming a branch, committing, creating or updating a pull request, writing its description or a changeset                                    |
| [.agents/rules/workflows-and-release.md](.agents/rules/workflows-and-release.md)                   | Changing anything under `.github/workflows/`, or release routing                                                                            |
| [.agents/rules/repository-layout-and-skills.md](.agents/rules/repository-layout-and-skills.md)     | Adding a package, choosing its directory, or adding or editing a Skill under `skills/`                                                      |
| [.agents/rules/dev-config.md](.agents/rules/dev-config.md)                                         | Creating a package, changing its tsconfig, ESLint, Prettier, Vitest or Vite configuration, dependencies and runtime, or publishing metadata |
| [.agents/rules/testing.md](.agents/rules/testing.md)                                               | Writing or moving a test, testing against a database, choosing what to validate                                                             |
| [.agents/rules/templates.md](.agents/rules/templates.md)                                           | Changing either application template, a plugin's business permissions, application themes and UI styling                                    |
| [.agents/rules/database-migrations.md](.agents/rules/database-migrations.md)                       | Writing or editing a migration or seed                                                                                                      |
| [.agents/rules/database-integration-tests.md](.agents/rules/database-integration-tests.md)         | Running dialect integration suites or `pnpm test:db`, changing the database packages                                                        |
| [.agents/rules/native-dependencies-and-builds.md](.agents/rules/native-dependencies-and-builds.md) | Native dependencies, `allowBuilds`, what reaches a deployment's `dist/`, building for another platform                                      |
| [.agents/rules/package-dependencies.md](.agents/rules/package-dependencies.md)                     | Adding or moving any dependency, identity-sensitive packages, `pnpm peers:check` or `pnpm deps:check` failures                              |
| [.agents/rules/http-api.md](.agents/rules/http-api.md)                                             | Adding or changing an `/api` route, API documentation, `pnpm openapi:check` failures                                                        |
| [.agents/rules/cli-json-output.md](.agents/rules/cli-json-output.md)                               | Adding or changing `--json` output of a command-line tool                                                                                   |
| [.agents/rules/docs-site.md](.agents/rules/docs-site.md)                                           | Changing anything under `docs/`                                                                                                             |
| [.agents/rules/typescript-libraries.md](.agents/rules/typescript-libraries.md)                     | Changing the exported API of a library package that emits declarations                                                                      |

For application themes and UI styling, also read `packages/app/app-skills/skills/nocobase-app-development/references/frontend/references/theme.md` from the repository root.
