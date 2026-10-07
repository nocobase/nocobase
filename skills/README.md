# Skills

This directory holds every Skill this repository commits. `pnpm install` links each of them into `.agents/skills/` and `.claude/skills/`, so agents working in the checkout see them; see "Repository Skills" in the root `AGENTS.md`.

| Skill                                                                 | Who uses it                                                                                                     | What it does                                                                                                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`nocobase-create-app`](nocobase-create-app/SKILL.md)                 | Users starting a project to develop, installed globally                                                         | Creates an application with `pnpm create @nocobase/app`, configures it with `nocobase config init`, `config set` and `config check`, and starts it |
| [`nocobase-app-installer`](nocobase-app-installer/SKILL.md)           | Users installing built NocoBase where it runs — a Hub, or an application's archive — installed globally         | Installs, upgrades, rolls back and checks a Hub from its template, or an application's deployment archive, with `@nocobase/app-installer`          |
| [`nocobase-plugin-development`](nocobase-plugin-development/SKILL.md) | Contributors developing plugins in a NocoBase 3 source workspace, linked by this checkout or installed globally | Scaffolds, implements, registers and verifies a NocoBase 3 plugin                                                                                  |

The two global Skills split by what the user ends up with. A project — source code someone changes, developed locally — is `nocobase-create-app`. An installation — built NocoBase that only runs, usually in production — is `nocobase-app-installer`. A Hub is installed, not created: installing one goes to `nocobase-app-installer` unless the user will develop the Hub's own code, which is a `nocobase-create-app` project with `--template=hub`. An application goes from one to the other: it is created and developed as a project, its own `nocobase-deployment` Skill builds the archive, and `nocobase-app-installer` installs it.

The rest of this file is about the two Skills users install globally. `nocobase-create-app` is how an agent reaches NocoBase 3 before any application exists; everything it needs after that ships inside the application, under `.agents/skills/`, synchronized from the installed packages. `nocobase-app-installer` is for the server: it installs a deployment archive built in an application project, or a Hub whose source is not changed, and a server has no project and no application Skills, so this Skill stays in use for every later upgrade.

Each is used against the published packages, which is what users do, or against the unreleased checkout, published to a local npm registry, which is how a change is tested before it is released.

## Where the packages come from

NocoBase 3 publishes its packages to `https://npm.nocobase.ai`, not to the public npm, where `@nocobase/create-app` and `@nocobase/app-installer` answer 404. Both Skills therefore name the registry on the command that fetches the first package, `npm_config_registry=… pnpm create @nocobase/app` and `npx --registry=… @nocobase/app-installer`, and nothing needs configuring beforehand. `pnpm create` takes no `--registry` of its own — pnpm 11 rejects one before `create` as an unknown option, and passes one after the package name to `create-app` — so the registry goes in the environment of that one command. From there the tools carry the registry themselves: `create-app` installs from it and writes `@nocobase:registry=https://npm.nocobase.ai/` into the new project's `.npmrc`, so a later `pnpm add @nocobase/…` inside the project resolves too, and app-installer does the same for every Hub release it builds. The user's own pnpm and npm configuration is not changed.

The Skills write the registry as `${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}`. `NOCOBASE_REGISTRY` is unset for users; `pnpm unreleased:env` sets it, which is what lets the same commands install the unreleased checkout.

## nocobase-create-app

### Requirements

- Node.js 24 or later and pnpm 11.
- An agent that loads Skills, such as Claude Code or Codex.

### Install the Skill

```bash
npx skills add nocobase/nocobase3 --skill nocobase-create-app -g
```

`--skill` is required. The `skills` CLI reads this whole directory, and without it would offer every Skill here at once. The others install the same way with their own name, `nocobase-plugin-development` for an agent working in a fork or another checkout, which this checkout links already. Add `-a claude-code`, or another agent's name, to install for one agent only.

Agents load Skills when a session starts, so start a new session after installing.

### Ask the agent

Open the agent in an empty directory and ask for an application, for example:

> Create a NocoBase application in this directory with SQLite, start it, and tell me how to sign in.

The Skill then:

1. Runs `npm_config_registry=… pnpm create @nocobase/app <name> --json` from the parent directory, so the files land in the directory you opened.
2. Follows the `nextCommands` that creation returns: `pnpm nocobase config init`, then `pnpm nocobase config set` for any `requiredSettings` of a database other than SQLite, then `pnpm nocobase config check`, and finally `pnpm dev` in the background.
3. Reports the URL and the first sign-in account, and recommends starting a new session in the application directory, where the application's own Skills are loaded reliably. If you keep working in the same session, it reads the application's `AGENTS.md` and Skills directly instead.

It never asks for a database password in the conversation. For a database other than SQLite it asks you to put the password in an environment variable, then reads it with `pnpm nocobase config set --from-env`.

### Without an agent

The Skill runs nothing you cannot run yourself:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 npm_config_registry=https://npm.nocobase.ai pnpm create @nocobase/app my-app
cd my-app
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

`PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` lets pnpm install versions published minutes ago. For another database, install its driver, name it, and fill in the connection before `pnpm nocobase config check`:

```bash
pnpm add @nocobase/db-postgres
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD
```

## nocobase-app-installer

### Requirements

On the server that will run the application:

- Linux or macOS; on Windows, WSL.
- Node.js 24 or later, and pm2 4.3 or later installed globally with `npm install -g pm2`. Building a Hub from its template also needs pnpm 11 or later.
- An agent that loads Skills.

### Install the Skill

```bash
npx skills add nocobase/nocobase3 --skill nocobase-app-installer -g
```

### Ask the agent

On the server, with the archive copied over, ask for the application, for example:

> Install the NocoBase application in /tmp/crm.tar.gz into /srv/nocobase/crm for https://apps.example.com.

Or ask for a Hub:

> Install a NocoBase Hub in /srv/nocobase/hub for https://apps.example.com, with SQLite.

The Skill first settles whether app-installer is the right route: a Hub whose source will change is an application project for `nocobase-create-app`, and Docker is the documented alternative. It says how to build the archive for the server when there is none yet, checks Node.js and pm2 (and pnpm for a Hub), runs `app-installer install --json`, and reports the URL, the first sign-in account, the `pm2 startup` command for you to run with sudo, and what the reverse proxy needs.

Later, in the installation directory, ask it to check, upgrade or roll back. It relays what an upgrade or a rollback will stop and back up, and runs it only after you confirm. An upgrade that fails after switching rolls itself back, and the Skill reports what happened; an operation interrupted while the application is down is recovered with `rollback`.

### Without an agent

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub --template hub --origin https://apps.example.com
```

`upgrade`, `rollback` and `status` take `--dir` with the installation directory; an archive installation upgrades with `--archive` and the new archive. The package README, `packages/tools/app-installer/README.md`, documents every flag, the directory layout and the exit codes.

## Test against the unreleased checkout

Use this to test a change before it is released: a change to a Skill, or to a package it drives, such as `create-app`, `app-installer`, a template or `app-cli`. The checkout is published to a local npm registry on your machine, and a shell is pointed at it, so the Skills' unchanged commands install the unreleased code.

A global Skill is released by merging it into `develop`, while packages are released by `release-beta`. A change to a Skill that describes new package behavior therefore has to be tried here first, because the published packages cannot show whether it works.

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

- A snapshot carries the same version numbers as the last release until one is cut. A package resolved from `https://npm.nocobase.ai/` looks identical to pnpm, so a partly configured shell produces an application that mixes a new template with old packages, and nothing reports it. The symptoms are a `config.yml` created before `config init` ran, no `.npmrc`, and a `pnpm nocobase` command reported as not found.
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
- An installation made by app-installer records `"registry": "http://127.0.0.1:4873"` in its `installer.json`. A Hub needs its port and the App Host port 13010 free; to keep an installation off your own pm2 processes, export a short `PM2_HOME`, such as `/tmp/nb-pm2`, before starting the agent. An archive to install comes from an application created with `pnpm unreleased:create` and built there with `pnpm build --tar`.

To look at what the local npm registry serves, query it with `curl`. In a shell without the variables above, a scoped registry in your own configuration overrides `npm view --registry`, and the answer comes from `https://npm.nocobase.ai/` instead:

```bash
curl -s http://127.0.0.1:4873/@nocobase%2fcreate-app
```

Worth covering when either global Skill changes, since each hands requests to the other:

- "Install NocoBase" or "try NocoBase" goes to `nocobase-create-app`, which creates a project.
- "Install a NocoBase Hub", on a laptop or a server, goes to `nocobase-app-installer` with `--template hub`.
- "I want to change the Hub's code" goes to `nocobase-create-app` with `--template=hub`.
- "Install NocoBase on this server" with no project or archive makes the agent ask what it is for before choosing a route.

Worth covering when `nocobase-create-app` changes:

- The default SQLite path, through to the page opening and the sign-in account being reported.
- A database other than SQLite, with the password supplied through `--from-env`.
- A directory that is not empty, which the Skill must refuse rather than overwrite.
- A directory that already holds an application, where the Skill must hand over to that application's `AGENTS.md`.
- With NocoBase 2 Skills also installed, the agent must choose this one and never run the `nb` CLI.

Worth covering when `nocobase-app-installer` changes:

- A fresh install from an archive and from `--template hub`, through to the URL, the sign-in account and the `pm2 startup` step being reported.
- An archive built for another machine, where the agent must relay the build command the error names rather than retry.
- An upgrade asked for without prior consent: the agent must relay the confirmation notes and wait before passing `--yes`.
- A request to customise the Hub's code, which the Skill must route to `nocobase-create-app` with `--template=hub`.
- A directory holding `installer.json`, where the agent must start with `status`.

### Without an agent

`pnpm unreleased:create my-app` creates an application from the snapshot under `../nocobase-local-apps/`, and `pnpm unreleased:smoke` runs the create-app smoke test against it. Both set up the environment themselves.

`pnpm unreleased:installer-smoke` runs the snapshot's `@nocobase/app-installer` against both sources through `scripts/smoke-app-installer.mjs`, the script the app-installer CI jobs run: it creates a default application, builds its archive, installs, upgrades and rolls it back, then does the same for a Hub from its template. `--source archive` or `--source template` runs one of them. It covers changes to the templates, `app-cli`, `app-host` and `create-app` that the CI jobs cannot see before a release. It needs pm2 on `PATH` and, for the Hub, the App Host port 13010 free, runs pm2 under its own `PM2_HOME` and stops it afterwards, and keeps the installations and their logs under the temporary directory it prints.

### 5. Clean up

```bash
rm ~/.claude/skills/nocobase-create-app ~/.claude/skills/nocobase-app-installer
pnpm unreleased:clean
```

`unreleased:clean` removes the local npm registry and its caches, not the applications or Hubs created from it.
