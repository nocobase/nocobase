# Skills

This directory holds globally distributed entry Skills and a temporary plugin-development migration bridge. Complete App guidance lives in `packages/app/app-skills/skills/`. The repository sync links the complete package-owned plugin development Skill locally instead of its same-named bridge; see `.agents/rules/repository-layout-and-skills.md`.

| Skill                                                                         | Who uses it                                                                       | What it does                                                                                                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`nocobase-create-app`](nocobase-create-app/SKILL.md)                         | Users starting a project to develop, installed globally                           | Creates an application with `pnpm create @nocobase/app`, configures it with `nocobase config init`, `config set` and `config check`, and starts it |
| [`nocobase-app-installer`](nocobase-app-installer/SKILL.md)                   | Users deploying a published application or deployment archive, installed globally | Installs, upgrades, rolls back and checks applications with `@nocobase/app-installer`                                                              |
| [`nocobase-app-plugin-development`](nocobase-app-plugin-development/SKILL.md) | Users migrating an older global installation                                      | Opens the current project Skill by path and guides retirement of the old global copy                                                               |

The two global Skills split by what the user ends up with. A project — source code someone changes, developed locally — is `nocobase-create-app`. An installation — built NocoBase that only runs, usually in production — is `nocobase-app-installer`. An application goes from one to the other: it is created and developed as a project, its own `nocobase-deployment` Skill builds the archive, and `nocobase-app-installer` installs it.

The rest of this file is about the two Skills users install globally. `nocobase-create-app` is how an agent reaches NocoBase 3 before any application exists; everything it needs after that ships inside the application, under `.agents/skills/`, synchronized from the installed packages. `nocobase-app-installer` installs a published npm application on the application server, or deploys an application archive locally or over SSH, and stays in use for later upgrades. With SSH archive deployment, the server needs no Agent or Skill.

Each is used against the published packages, which is what users do, or against the unreleased checkout, published to a local npm registry, which is how a change is tested before it is released.

## Lightweight distribution

Install the global entry points you need (choose one or both explicitly):

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
npx skills@latest add nocobase/skills-v3 --skill nocobase-app-installer -g
```

Edit global entry instructions in this source directory; edit full plugin development guidance in `packages/app/app-skills/skills/nocobase-app-plugin-development/`. `.github/workflows/v3-skills-sync.yml` notifies the distribution repository when `skills/**` changes on `v3-develop`; there is no scheduled polling. The distribution workflow downloads the skills subtree at one immutable commit, preserving references, scripts, assets, executable modes and deletions. Identical content produces no commit. Its `.sync-source.json` records the source revision; failures remain visible in Actions and can be retried manually. The distribution script and its tests are maintained in `nocobase/skills-v3`.

The source notifier reuses `vars.NOCOBASE_APP_ID` and `secrets.NOCOBASE_APP_PRIVATE_KEY`, requesting contents-write access only to `skills-v3`. The target publishes using its own `GITHUB_TOKEN`. The default-branch `main` workflow entry dispatches the `v3-develop` implementation with the same filename and no inputs; land the implementation first. Manual synchronization can also be run directly in the distribution repository.

The source and distribution both use `nocobase-app-plugin-development`, avoiding the V2 `nocobase-plugin-development` name. Reinstall to migrate from an earlier global name; old global installations are not removed automatically. Determine whether an old installation belongs to V2 or V3 before removing it.

Rerun the install command to migrate installations from the old large-repository URL and to update these Skills. `npx skills@latest update` checks all tracked Skills for updates. Global Skills must still describe released package behavior before merging; synchronization does not remove that release requirement. See the [distribution README](https://github.com/nocobase/skills-v3) for maintenance and recovery.

## Where the packages come from

NocoBase 3 publishes its packages to the public npm registry. Both Skills keep the registry local to the command and write it as `${NOCOBASE_REGISTRY:-https://registry.npmjs.org}`. `NOCOBASE_REGISTRY` is normally unset; `pnpm unreleased:env` sets it to the local snapshot registry, and a private installation can set it to its own source. `create-app` records a non-public registry for the `@nocobase` scope in the generated project's `.npmrc`, while public npm needs no override. The user's own pnpm and npm configuration is not changed.

Published installation commands select `beta` explicitly for the creation tool, application template and deployment installer. The Skills themselves still come from GitHub `v3-develop`; `npx skills` is a separate tool and does not need a beta tag.

## nocobase-create-app

### Requirements

- Node.js 24 or later and pnpm 11.
- An agent that loads Skills, such as Claude Code or Codex.

### Install the Skill

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

The lightweight `nocobase/skills-v3` repository distributes the Skills from `v3-develop/skills/` without downloading the application repository. Add `-a claude-code`, or another agent's name, to install for one agent only. `nocobase/skills` remains the NocoBase 2 source.

Plugin development uses the project's `.agents/skills/nocobase-app-plugin-development/SKILL.md`, synchronized from a compatible installed `@nocobase/app-skills`. Do not install a global copy. If it is missing, inspect the installed package and use the App upgrade guidance instead of independently updating one framework package.

Already installed globally? The old name remains as a small migration bridge. After a compatible App release is installed and its full project Skill is verified, remove the exact old global installation and its Agent links, preserving custom content and checking symlink targets. The target release's `nocobase-app-upgrade/references/plugin-development-skill.md` covers discovery, cleanup, recovery and starting a new Agent session. Global files are not removed automatically by App installation or synchronization.

Agents may keep already-loaded Skills in a session; start a new session after installation or migration.

### Ask the agent

Open the agent in an empty directory and ask for an application, for example:

> Create a NocoBase application in this directory with SQLite, start it, and tell me how to sign in.

The Skill then:

1. Runs `npm_config_registry=… pnpm create @nocobase/app@beta <name> --template-tag=beta --json` from the parent directory, so the files land in the directory you opened.
2. Follows the `nextCommands` that creation returns: `pnpm nocobase config init`, then `pnpm nocobase config set` for any `requiredSettings` of a database other than SQLite, then `pnpm nocobase config check`, and finally `pnpm dev` in the background.
3. Reports the URL and the first sign-in account, and recommends starting a new session in the application directory, where the application's own Skills are loaded reliably. If you keep working in the same session, it reads the application's `AGENTS.md` and Skills directly instead.

It never asks for a database password in the conversation. For a database other than SQLite it asks you to put the password in an environment variable, then reads it with `pnpm nocobase config set --from-env`.

### Without an agent

The Skill runs nothing you cannot run yourself:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` lets pnpm install versions published minutes ago. For another database, install its driver, name it, and fill in the connection before `pnpm nocobase config check`:

```bash
pnpm add @nocobase/db-postgres@beta
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD
```

## nocobase-app-installer

### Requirements

For SSH deployment, the local machine needs Node.js 24+, SSH, scp and an Agent that loads Skills. The remote Linux server needs Node.js 24+, pm2 4.3+ and tar on its non-interactive PATH, but no Agent, Skill or npm access. Prepare those runtimes before deploying to an offline server.

For installation on the same machine as the Agent, use Linux or macOS (WSL on Windows), with Node.js 24+ and pm2 4.3+.

### Install the Skill

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-app-installer -g
```

### Ask the agent

In the local application project, ask for remote deployment, for example:

> Build this application and deploy it over SSH to deploy@server in /app/my-app, for https://app.example.com.

The Agent follows the project’s build guidance, then runs `deploy --ssh` locally. The installer uploads its offline runtime bundle and the application archive, and installs or upgrades on the server. See [remote deployment](nocobase-app-installer/references/remote-deployment.md) for prerequisites, verification and recovery.

Alternatively, on the server with the archive copied over, ask:

> Install the NocoBase application in /tmp/crm.tar.gz into /srv/nocobase/crm for https://apps.example.com.

The Skill first settles whether app-installer is the right route: an application still to be developed is a project for `nocobase-create-app`, and Docker is the documented alternative. It says how to build the archive for the server when there is none yet, checks Node.js and pm2, runs `app-installer install --json`, and reports the URL, the first sign-in account, the `pm2 startup` command for you to run with sudo, and what the reverse proxy needs.

For NocoBase Studio, ask it to install a published npm release with `--app studio` (equivalent to `--app @nocobase/studio`). The [Studio reference](nocobase-app-installer/references/studio.md) covers checking release availability, installation without a repository checkout, upgrades in the same directory, and checks of login, business records, files and restart persistence. This route also needs npm and pnpm 11+ to build the downloaded application.

Later, in the installation directory, ask it to check, upgrade or roll back. It relays what an upgrade or a rollback will stop and back up, and proceeds within the interruption and data operation you have authorized, asking when that consent is still missing. An upgrade that fails after switching rolls itself back, and the Skill reports what happened; an operation interrupted while the application is down is recovered with `rollback`.

### Without an agent

```bash
npx --yes @nocobase/app-installer@beta install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
```

`upgrade`, `rollback` and `status` take `--dir` with the installation directory; `upgrade` takes the new archive with `--archive`, or resolves the recorded npm application with optional `--to <version or tag>`. The package README, `packages/tools/app-installer/README.md`, documents every flag, the directory layout and the exit codes.

## Test against the unreleased checkout

Use this to test a change before it is released: a change to a Skill, or to a package it drives, such as `create-app`, `app-installer`, a template or `app-cli`. The checkout is published to a local npm registry on your machine, and a shell is pointed at it, so the Skills can install the unreleased code. This snapshot registry uses `latest`: for this local test only, replace the creation tool and installer’s `@beta` with `@latest`, and set `--template-tag=latest`. Keep the published installation commands on `beta`.

A global Skill is released by merging it into `v3-develop`, while packages are released by the `v3-release-beta.yml` workflow. A change to a Skill that describes new package behavior therefore has to be tried here first, because the published packages cannot show whether it works.

### Requirements

- Everything above, plus Docker, which runs the local npm registry.
- A checkout of this repository with dependencies installed.

### 1. Publish the checkout

From the repository root:

```bash
pnpm unreleased:prepare
```

This builds every publishable package, publishes it to a Verdaccio on `http://127.0.0.1:4873/`, and points each package's `latest` tag at the snapshot. Add `--reset` to replace a previous snapshot. The session lives under `$TMPDIR/nocobase-unreleased-<id>/` and does not depend on which branch is checked out, so switching branches afterwards keeps it usable.

### 2. Link the Skill from the checkout

For Claude Code, link it, so that an edit to its `SKILL.md` reaches the next session without reinstalling:

```bash
ln -sfn "$PWD/skills/nocobase-create-app" ~/.claude/skills/nocobase-create-app
ln -sfn "$PWD/skills/nocobase-app-installer" ~/.claude/skills/nocobase-app-installer
```

The link follows the working tree, so it breaks while a branch without the Skill is checked out. For any agent, `npx skills add ./skills/<name> -g` installs a copy instead, which has to be repeated after every edit.

### 3. Point a shell at the snapshot

Open a new shell, and from the repository root:

```bash
eval "$(pnpm -s unreleased:env)"
pnpm config get @nocobase:registry
```

The second command must print `http://127.0.0.1:4873/`. `-s` keeps pnpm's own `$ node …` line out of what the shell evaluates.

`unreleased:env` prints the same variables `unreleased:create` and `unreleased:smoke` run with, including `NOCOBASE_REGISTRY` and a session-only store and cache. Setting a few of them by hand is not enough, and fails silently:

- A snapshot carries the same version numbers as the last release until one is cut. A package resolved from public npm looks identical to pnpm, so a partly configured shell produces an application that mixes a new template with published packages, and nothing reports it. The symptoms are a `config.yml` created before `config init` ran, no private-registry entry in `.npmrc`, and a `pnpm nocobase` command reported as not found.
- `pnpm config set @nocobase:registry …` saves the scoped registry to `auth.ini` in pnpm's global configuration directory, `~/Library/Preferences/pnpm` on macOS. `PNPM_CONFIG_USERCONFIG` does not replace that file, and only `XDG_CONFIG_HOME` moves the directory, so the command sets it for the whole shell. Tools that keep their own settings there, such as `gh`, will not find them until you open a new shell.

If the shell uses an HTTP proxy, keep `127.0.0.1` in `NO_PROXY` so the local npm registry is reached directly.

### 4. Ask the agent

In the same shell, create an empty directory outside the repository and start the agent there:

```bash
mkdir -p ~/nb-skill-test/my-app && cd ~/nb-skill-test/my-app && claude
```

Ask exactly as in the published case. A snapshot install can be told apart from a published one:

- There is no `config.yml` until `pnpm nocobase config init` runs.
- `.npmrc` contains `@nocobase:registry=http://127.0.0.1:4873/`.
- `node_modules/@nocobase/app-cli/dist/commands/config/` contains `init.js`, `check.js` and `set.js`.
- An installation made by app-installer records `"registry": "http://127.0.0.1:4873"` in its `installer.json`. To keep an installation off your own pm2 processes, export a short `PM2_HOME`, such as `/tmp/nb-pm2`, before starting the agent. An archive to install comes from an application created with `pnpm unreleased:create` and built there with `pnpm build --tar`.

To look at what the local npm registry serves, query it with `curl`. In a shell without the variables above, a scoped registry in your own configuration can override `npm view --registry`, so use the registry URL directly:

```bash
curl -s http://127.0.0.1:4873/@nocobase%2fcreate-app
```

Worth covering when either global Skill changes, since each hands requests to the other:

- "Install NocoBase" or "try NocoBase" goes to `nocobase-create-app`, which creates a project.
- "Install NocoBase on this server" with no project or archive makes the agent ask what it is for before choosing a route.

Worth covering when `nocobase-create-app` changes:

- The default SQLite path, through to the page opening and the sign-in account being reported.
- A database other than SQLite, with the password supplied through `--from-env`.
- A directory that is not empty, which the Skill must refuse rather than overwrite.
- A directory that already holds an application, where the Skill must hand over to that application's `AGENTS.md`.
- With NocoBase 2 Skills also installed, the agent must choose this one and never run the `nb` CLI.

Worth covering when `nocobase-app-installer` changes:

- A fresh install from an archive, through to the URL, the sign-in account and the `pm2 startup` step being reported.
- An archive built for another machine, where the agent must relay the build command the error names rather than retry.
- An upgrade asked for without prior consent: the agent must relay the confirmation notes and wait before passing `--yes`.
- A directory holding `installer.json`, where the agent must start with `status`.
- A request to install published Studio without a repository checkout: test both `--app studio` and `--app @nocobase/studio`, check Node/pnpm/pm2 prerequisites, preserve the published identity and version, and verify login and persistence. Check actual registry availability; a local snapshot does not prove public npm availability.
- A Studio distribution check: verify the selected build carries `dist/runners/stable/` manifests for `nocobase-runner` and `nb-studio`, matching `dist/server/agents/served-versions.json`, and download both universal packages through the installation. Record downloads separately from runtime registration, model configuration and task execution.
- A Studio upgrade: identify the existing source kind, use npm `upgrade` with `--to` or `--rebuild` as appropriate (or `--archive` for archive installations), keep its data and mount path, obtain the confirmation notes, and honor already-authorized downtime without creating a second installation. Updating the installer package alone must not be reported as upgrading Studio.

### Without an agent

`pnpm unreleased:create my-app` creates an application from the snapshot under `../nocobase-local-apps/`, and `pnpm unreleased:smoke` runs the create-app smoke test against it. Both set up the environment themselves.

Add `--internal-packages` to `pnpm unreleased:smoke` to run the application Skill's complete internal-package example in the generated application. This requires the Playwright Chromium browser (`pnpm exec playwright install chromium` from an application). It checks package scripts and declaration updates, browser HMR without a page reload, server reloads, and the same greeting in a production archive with the source paths unavailable. The option also works with `--template examples`. Source directories are temporarily renamed during archive verification and restored during cleanup; use the smoke command's disposable generated application.

`pnpm unreleased:installer-smoke` runs the snapshot's `@nocobase/app-installer` through `scripts/smoke-app-installer.mjs`, the script the app-installer CI jobs run: it creates a default application, builds its archive, installs, upgrades and rolls it back. It covers changes to the templates, `app-cli` and `create-app` that the CI jobs cannot see before a release. It needs pm2 on `PATH`, runs pm2 under its own `PM2_HOME` and stops it afterwards, and keeps the installations and their logs under the temporary directory it prints.

### 5. Clean up

```bash
rm ~/.claude/skills/nocobase-create-app ~/.claude/skills/nocobase-app-installer
pnpm unreleased:clean
```

`unreleased:clean` removes the local npm registry and its caches, not the applications created from it.
