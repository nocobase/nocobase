# Branches, Commits, Pull Requests and Changesets

Read this before naming a branch, writing a commit, or creating or updating a pull request.

## Branches, Commits and Pull Requests

Name a branch after the kind of change it carries. V3 development branches use `feat/v3-<name>` for a feature and `fix/v3-<name>` for a bug fix, where `<name>` is a non-empty short kebab-case description such as `feat/v3-app-installer`; other change kinds use their Conventional Commits type the same way, such as `docs/v3-<name>`, `refactor/v3-<name>` or `chore/v3-<name>`. GitHub Actions writes the valid stacked v3 pull request target pattern as the glob `*/v3-*`; under this naming rule, where both the type and name are non-empty and contain no slash, it covers the same branches as the bot and CI regular expression `/^[^/]+\/v3-[^/]+$/`. Never push a branch under a tool's own prefix, such as the `claude/` or `codex/` branch an agent's worktree starts on: rename it with `git branch -m` before its first push. Renaming it once a pull request is open does not carry the pull request along: GitHub closes the pull request as if its head branch had been deleted, and a pull request's head branch cannot be changed afterwards, so the change has to be reopened as a new pull request from the renamed branch, and the review on the old one stays there.

A run NocoBase Studio starts for an issue works on a branch named `agent/<issue key>`, such as `agent/PM-42`, which Studio's branch rules create and track; that prefix is Studio's, not a tool's, and is allowed. Its pull request title still follows Conventional Commits.

Commit messages and pull request descriptions carry no attribution to an AI tool: no `Co-Authored-By` trailer naming a model or an agent, and no "Generated with …" line. A trailer naming a human co-author is unaffected. The repository's `.claude/settings.json` turns Claude Code's own attribution off for everyone working here; the rule holds whichever tool writes the commit, so a tool that adds such lines by default has to be told not to.

## Pull Request Descriptions and the Changelog

Every pull request into `v3-develop`, `v3-main` or a stacked `*/v3-*` branch follows `.github/pull_request_template.md` on `v3-develop`. GitHub reads pull request templates only from the default branch, so its web form offers the v2 template from `main` instead; that template's "This is a ..." list and Changelog table have the same shape and pass the same check, and its extra sections are ignored. An agent opening a pull request with `gh pr create --body` writes the v3 template's sections itself.

- **This is a ...**: check exactly one of New feature, Improvement, Bug fix and Others. Others is for what no user notices — tests, CI, development scripts, documentation-only changes, refactors — and stays out of the changelog. It is independent of the `release:skip` label: a refactor of a published package still needs a changeset unless it takes that label, and a user-visible fix still needs a changelog sentence.
- **Changelog**: for the other three types, one sentence per language about what a user notices, not how it was built: "Keep demo sign-in sessions when a demo is embedded in another site." / "演示环境嵌入其他站点时保留登录状态。", not "Refactor the cookie provider". Placeholders such as `TODO`, `N/A`, `-` or `无` fail the check. Leave both cells empty for Others.
- **Module**: the conventional-commit scope of the title, `type(scope): subject`, names the module the entry is listed under, through `scripts/changelog-scopes.json`. A package's short name works, and so does its directory or package name (`app-plugin-demo-mode`, `@nocobase/app-plugin-demo-mode`). An unknown or missing scope only warns and lists the entry under General. Use a scope from the file that covers the change; add one, with its English and Chinese module names, only when none does.

`.github/workflows/v3-pr-description.yml` runs `scripts/check-pr-body.mjs` as the `PR description` check whenever a pull request is opened, pushed to, or has its title or description edited, so fixing the description reruns it. Check a description locally with `node scripts/check-pr-body.mjs <file>` on a JSON file holding `{ "title", "body" }`. Pull requests opened by the release workflows are skipped.

At release, `scripts/changelog.mjs`, run by the prepare job of `v3-release-beta.yml` and `v3-release-stable.yml`, reads the descriptions of the pull requests the release contains and prepends a section to the root `CHANGELOG.md` and `CHANGELOG.zh-CN.md` in the release commit; `v3-github-release.yml` then puts the English section at the top of the GitHub Release, above the published packages. A beta contains the pull requests merged since the previous beta. A stable release contains those merged into its branch since the previous stable release, plus every pull request a beta section lists that no stable section lists yet, because a promotion reaches `v3-main` as one squashed commit. A pull request whose description does not parse is left out with a warning in the release run, so fix descriptions before the release, not after: the changelog is written once, into the release commit.

## Before Creating or Updating a Pull Request

Read [.changeset/README.md](../../.changeset/README.md) before creating or updating a PR. If the PR changes a publishable package and affects its published output, include a changeset in the same PR covering every affected package. Run `node scripts/validate-changesets.mjs` before pushing.

CI enforces this rather than suggesting it: `scripts/require-changesets.mjs` fails the PR when a changed package has no changeset covering it. It asks whether a file reaches the published artifact, not whether the change deserves a release, so what it exempts is narrow — a package's `README`, `CHANGELOG`, `docs/`, its tests, and the development configuration it does not ship. Everything else counts, including `AGENTS.md`, `CLAUDE.md` and `skills/`: those are published with the package and synchronized into an installed application's `.agents/skills/`, so an unreleased change to them leaves every consumer's agent working from the previous rules. A template package is stricter still, because its `files` field ships its own `eslint.config.js`, `vitest.config.ts` and tsconfigs as source a user reads and edits.

Run it locally the way CI does before pushing:

```bash
BASE_SHA=$(git merge-base origin/v3-develop HEAD) HEAD_SHA=$(git rev-parse HEAD) \
  node scripts/require-changesets.mjs
```

When a change genuinely should not be released — a pure refactor, or reverting something that never shipped — add the `release:skip` label to the PR and say why in the description. The label is the only way past the check, which keeps the decision visible in the PR rather than hidden in a changeset nobody meant to write.

While `v3-develop` is in prerelease mode, a `major` changeset cannot move a package that is already an `X.0.0-beta.N` prerelease: changesets computes `semver.inc('1.0.0-beta.33', 'major')`, which is `1.0.0`, and releases `1.0.0-beta.34`, so the break never shows in the version. `node scripts/validate-changesets.mjs` rejects such a changeset. Set the package's `version` to `<X+1>.0.0-beta` and add a matching `## <X+1>.0.0-beta` heading to its `CHANGELOG.md`, which the release turns into `<X+1>.0.0-beta.0`, and give every package that lists it in `dependencies` or `peerDependencies` a `patch` entry in the same changeset, because their `workspace:^` ranges still accept the new version and changesets will not release them on its own.

A new changeset goes in `.changeset/`, never in `.changeset/pre/`. That subdirectory belongs to the changesets tool: while the branch is in prerelease mode, `changeset version` moves each changeset it has already consumed into it, and reads the whole directory again on later runs to compute the accumulated bump. Writing a new file there directly presents it as already released — the release run never consumes it, so its summary never reaches the CHANGELOG and the version it asked for is never applied. Nothing fails; the changeset is silently ignored. The directory is full of files because the branch has been releasing for a while, which makes it an easy place to add one by imitation.
