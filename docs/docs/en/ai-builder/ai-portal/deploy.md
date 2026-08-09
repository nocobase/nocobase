---
title: "Deployment and Source Management"
description: "The full develop, push, and deploy flow for an AI Portal, plus the two source storage modes and multi-environment deployment."
keywords: "AI Portal,deployment,source storage,Git,nb portal deploy,nb portal push,multi-environment"
---

# Deployment and Source Management

:::tip Prerequisites

Before reading this page, make sure you have your first Portal running by following the [AI Portal Quick Start](./index.md).

:::

Portal source lives in three places: the local dev workspace, source storage, and the deployed artifacts. `nb portal` keeps them in sync.

## The full lifecycle

The day-to-day loop looks like this:

```text
dev (local development) → push (push source) → deploy (build and deploy)
```

Where:

1. `nb portal dev <portal>` — Start the local dev server, change code and see the result
2. `nb portal push <portal>` — Push local source changes to source storage
3. `nb portal deploy <portal>` — Build and deploy, making changes live for users

If you're picking up a Portal a colleague already created, or you've switched machines, pull it locally first:

```bash
nb portal list                 # See which Portals exist
nb portal pull customer        # Pull the source locally
nb portal dev customer         # Start developing
```

`pull` downloads and unpacks the source into the dev workspace, `./<portal>` by default, or elsewhere with `--path`. Dependencies are installed automatically; add `--no-install` to skip that in CI or when you'd rather install them yourself.

After a successful pull, the dev workspace location is recorded in the CLI env config, so `dev`, `push`, and `deploy` all read the source from there without you specifying it every time.

## Adding a Portal

An application can have several Portals with separate pages and permissions but shared data. Say one entry for internal staff and one for external customers:

```bash
nb portal create customer
```

Creating generates `./customer` in the current directory as the dev workspace from the `@nocobase/portal-template-default` template, writes `.env` and `.env.local`, then installs dependencies. Use `--path` to put it elsewhere.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

A Portal name can only contain lowercase letters, digits, underscores, and hyphens, and must start with a lowercase letter or digit.

## source storage

Portal source can be kept in two places:

| Mode | Description | When to use |
| --- | --- | --- |
| `nocobase` | The default, with source managed by NocoBase's source storage | Getting started quickly, solo development, no code review needed |
| `git` | Source saved to a Git repository you specify | Team collaboration, code review, CI integration |

The default `nocobase` is the fastest to start with, since you don't need a repository first. It has no version history though, so a bad change can only be rolled back by overwriting everything. **If this Portal will be iterated on long term, move it to Git early.**

### Switching to Git

`create` only generates the dev workspace; source storage configuration goes through `config`. You can switch any time after creating:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` syncs the source storage setting to the remote Portal record, and subsequent `push` calls go through Git.

With one Portal per repository, the default repository root works fine for `--git-path`. You only need a subdirectory when you want several Portals in the same repository:

```bash
nb portal config customer --git-path portals/customer
```

### Pulling from another repository temporarily

To try out source from another repository without changing the Portal's configuration, `pull` accepts a one-off override:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

This doesn't modify the remote Portal record, and `--git-branch` and `--git-path` can only be used together with `--git-repo`. To switch to Git storage permanently, use `config` as above.

`config` can also change where the dev workspace lives — after moving the source to another directory, tell the CLI its new location with `--path`:

```bash
nb portal config customer --path ./workspaces/customer
```

## Differences between env types

`nb portal` synchronizes differently depending on the env type:

| env type | Description |
| --- | --- |
| `local` | The application is on this machine. `pull` fetches the source into the dev workspace, `deploy` builds from the dev workspace and syncs the artifacts |
| `docker` | The application runs in Docker, shared through a volume. Behavior is the same as above |
| `http` | Synchronized through the API. `pull` / `push` download or upload a source archive |

`ssh` envs don't support Portal management yet.

## Multi-environment deployment

The same Portal can be deployed to different environments, with `--env` naming the target:

```bash
nb portal deploy customer --env prod --yes
```

`--yes` skips the interactive confirmation. When the `--env` you pass explicitly differs from the current env, the CLI stops and asks by default. Remember to include `--yes` in scripts or CI, otherwise the command hangs at the confirmation.

For cross-environment collection schema and configuration releases, see [Release Management](../publish.md).

## Access path

Once deployed, a Portal's access path is:

```text
<appPublicPath>/x/<portal>/
```

For a Portal under a sub-application:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

The `/x/` prefix belongs to AI Portals; no-code Portals use `/v/`.

## Deleting a Portal

```bash
nb portal destroy customer
```

This deletes the Portal record and its deployed files, keeping the local dev workspace by default. Add `--delete-dev-path` when you want the dev workspace gone as well.

## Related Links

- [AI Portal Quick Start](./index.md) — Get your first AI-written frontend entry running
- [Building with an AI Agent](./agent-workflow.md) — Drive the AI to write pages in natural language
- [Project Structure and Tech Stack](./project-structure.md) — Build commands and environment variables
- [Release Management](../publish.md) — Release collection schemas and configuration across environments
- [`nb portal` Command Reference](../../api/cli/portal/index.md) — Complete parameter reference for all Portal commands
- [`nb portal create`](../../api/cli/portal/create.md) — All parameters for creating a Portal
- [`nb portal config`](../../api/cli/portal/config.md) — Adjust source storage and the dev workspace path
- [`nb portal push`](../../api/cli/portal/push.md) — Push source to source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — Build and deploy a Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Pull source from source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — Delete the Portal record and its deployed files
