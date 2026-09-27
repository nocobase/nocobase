---
name: nocobase-create-app
description: Create a new NocoBase 3 application with `pnpm create @nocobase/app`, configure it with `pnpm nocobase config init`, `config set` and `config check`, start it, and hand over to the application's own guidance. Use when the user asks to install, create, set up or try NocoBase and the working directory holds no NocoBase application yet. Not for NocoBase 2 or the `nb` CLI, and not for work inside an existing application, which carries its own AGENTS.md and Skills.
---

# Create a NocoBase 3 application

This Skill gets a new application created, configured and running. It does not describe how to develop one: the moment the application exists, its own `AGENTS.md` and `.agents/skills/` take over. Those match the version that was installed and this Skill does not, so prefer them wherever the two differ.

## Before you start

- If the working directory already holds a NocoBase application — a `package.json` with a `nocobase` field, next to an `AGENTS.md` — do not use this Skill. Read that `AGENTS.md` and continue from it.
- NocoBase 3 is created with `pnpm create @nocobase/app`. Never fall back to NocoBase 2 instructions or the `nb` CLI, including when a package cannot be found; see Troubleshooting instead.
- To run a Hub on a server without changing its source, use the `nocobase-hub-installer` Skill instead. This Skill creates a project to develop, including a Hub project with `--template=hub` when the Hub's own code will change.
- On Windows, work in WSL. The commands below assume a POSIX shell such as Bash; the subshell and the inline environment variable do not work in PowerShell or cmd.
- Check `node --version` (24 or later) and `pnpm --version` (11). If either is missing or does not match, stop before creating anything and tell the user:
  - which tool is missing or which version was found, and which version is required;
  - the command to install it on their operating system, preferring a version manager they already use, such as `nvm install 24` or `fnm install 24`, and for pnpm `corepack enable && corepack prepare pnpm@11 --activate` or `npm install -g pnpm@11`;
  - to open a new shell afterwards, so the new version is on `PATH`.

  Do not install either yourself unless the user asks. Check both versions again before continuing.
- Create the application in the directory the user names, or in the current directory when it is empty. The directory must be new or empty, and its name becomes the application name: it starts with a lowercase letter or digit and contains only lowercase letters, digits, dots, dashes and underscores. If the directory is not empty or its name is invalid, ask the user for another one. Never overwrite files, and never create a nested project and move its files afterwards.

## Create

`pnpm create @nocobase/app` does not accept `.` as the name. Run it from the parent directory with the target directory's name, which generates the files directly into it:

```bash
(cd <parent-directory> && PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm --registry="${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}" create @nocobase/app <name> --json)
```

- NocoBase 3 packages, `@nocobase/create-app` included, are published to `https://npm.nocobase.ai`, not to the public npm, where a bare `pnpm create @nocobase/app` answers 404. `--registry` before `create` fetches `create-app` from there; `create-app` then installs from the same registry and records it in the project's `.npmrc`, so a later `pnpm add @nocobase/…` inside the project resolves too. Leave the user's pnpm configuration unchanged; `pnpm config set @nocobase:registry` is not needed.
- `NOCOBASE_REGISTRY` is set only when the shell is pointed at another registry, such as an unreleased snapshot; `create-app` reads it too.
- `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` lets pnpm install versions published minutes ago.
- `--json` never prompts. It prints one JSON result on stdout and progress on stderr, so parse stdout only.

Read the result before doing anything else:

| Result                    | What to do                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `status: "success"`       | Continue below. Report any `warnings`.                                                                     |
| `stage: "input"` (exit 2) | Fix the arguments. Nothing was created.                                                                    |
| `stage: "download"`       | Check the network, and that `https://npm.nocobase.ai/` is reachable. Nothing was created.                  |
| `stage: "install"`        | The project exists. Run `pnpm install` inside it to retry, then continue with Configure. Do not create it again. |
| `stage: "verify"`         | The SQLite driver's native addon did not load, even after a rebuild. Report `message`; it names the cause. |
| any other error           | Report `message` and `directory` to the user.                                                              |

Never delete the directory to retry.

## Configure

Work from the application directory from here on. Read its `AGENTS.md` now: it appeared after this session started, so it may not be loaded.

The result's `nextCommands` configure the application for SQLite and then start it. When a retried install left you without them, they are `pnpm nocobase config init`, `pnpm nocobase config check`, then `pnpm dev`. Unless the user has already named a database, ask which one they want before running them, and adapt them as the steps below describe: a database other than SQLite needs its driver, a `--dialect`, and a `config set` between `config init` and `config check`. Pass `--json` to every `pnpm nocobase config` command and act on the document it prints, not on the exit code alone: `ok` says whether it worked, `result` holds what it produced, and a failure's `error.code`, `error.suggestions` and `error.details` say what to do next.

1. **Choose the database.** Use the one the user named, or ask. SQLite needs nothing installed: the template depends on its driver. For any other database, install its driver first, for example `pnpm add @nocobase/db-postgres`.
2. **`pnpm nocobase config init --dialect <dialect> --json`** writes `config.yml` from the application's `config.example.yml`, with generated secrets.
   - It installs nothing. When the driver is missing it writes nothing and fails with `error.code` `DRIVER_MISSING`; `error.suggestions[0].run` is the `pnpm add` that supplies it. Run that, then run `config init` again.
   - An application that is already configured is reported with `status: "success-noop"`, so re-running the sequence is safe.
   - `result.requiredSettings` lists the connection settings still at a placeholder.
3. **`pnpm nocobase config set key=value … --json`** sets each of the `requiredSettings`, for example `database.connections.main.host=db.internal`. A password is always set from an environment variable; see Secrets below.
4. **`pnpm nocobase config check --json`** must pass before the application is started. It loads the configuration without starting the application and connects to the database. A failure has `error.code` `CONFIG_INVALID` and its findings in `error.details.findings`; each names its key and, where there is one, a `fix` to run. Apply the fixes and run it again.

For the details of a particular database, read `.agents/skills/nocobase-app-development/references/database-connections.md` in the application.

If `pnpm nocobase config init --help` reports that the command does not exist, the application predates these commands: follow its `AGENTS.md` instead of this section.

## Start

The last of the `nextCommands`, `pnpm dev`, does not exit. Run it in the background and wait for the URL it prints: it prints a `Local:` line only once the application is ready, and the URL includes the application's path, such as `/main/`. Request that exact URL, for example with `curl -I`, expecting a successful response before reporting success. It refuses to start an application that is not configured; run `pnpm nocobase config check --json` and follow its fixes.

## Secrets

- Never ask for a password in the conversation, and never put one on a command line. Ask the user to set it in an environment variable, then run `pnpm nocobase config set --from-env database.connections.main.password=<VARIABLE> --json`.
- Never print `config.yml` or any secret it contains.
- Do not pass `--force`, delete `config.yml` or drop a database to make a step pass. `config init --force` replaces an existing configuration and is only for when the user asks for exactly that.

## Finish

Tell the user:

- The application directory and the URL.
- The first sign-in account. It comes from `users.initialAdmin` in the configuration: by default the username `nocobase` (email `admin@nocobase.com`) with the password `admin123`. Read that key rather than assuming the defaults, never repeat a password the user chose, and remind them to change the default one after signing in.
- That the service was started by this session and stops when the session ends, and how to start it again: `pnpm dev` in the application directory, run in their own terminal or by the next session.
- Where to continue. The application's `AGENTS.md` and Skills appeared after this session started. Some agents pick them up without a restart; others load them only when a session starts. Check which case applies instead of assuming:
  - **They are loaded here** (for example, the application's `nocobase-app-development` Skill is among your available Skills, and the application directory is this session's working directory): tell the user they can continue in this session. No new session is needed.
  - **They are not loaded here**: tell the user to start a new agent session in the application directory, and say exactly how. When the application is in this session's directory, they only need to end this session and start a new one in the same directory. Otherwise, give the full path and the command that starts your own agent there, for example `cd /work/my-app && claude` for Claude Code. In a desktop client, they open that directory as the project and start a new session there.
- What to ask for next, in this session or the new one:
  - A small first feature, for example: "Read the project's AGENTS.md first, then add an order list where signed-in users can create and edit orders, saved to the application database."
  - The step-by-step guide: https://github.com/nocobase/nocobase3/blob/develop/docs/docs/en/get-started/first-feature.md

Keep this handover short: one line per point, commands and paths in code formatting, and only the case that applies to this user.

If the Skills are not loaded but the user wants to keep working in this session anyway, do not rely on them: follow the application's `AGENTS.md` and read the relevant `.agents/skills/<name>/SKILL.md` directly.

## Troubleshooting

| Symptom                                              | Fix                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@nocobase/create-app` not found (404) when creating | Name the registry before `create`, as in the Create command: `pnpm --registry=https://npm.nocobase.ai create @nocobase/app`. |
| `@nocobase/...` not found (404) in the application   | Its `.npmrc` lacks `@nocobase:registry=https://npm.nocobase.ai/`. Add that line to the project's `.npmrc`.   |
| No version matches, or the newest one is ignored     | Set `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` for the command.                                                     |
| `Could not locate the bindings file`                 | Install scripts were disabled (`ignore-scripts=true`). Run `pnpm rebuild better-sqlite3` in the application. |
| A warning that the Skills could not be synchronized  | Run `pnpm nocobase skills sync` in the application.                                                          |
| `pnpm dev` or `pnpm start` says it is not configured | Run `pnpm nocobase config init --json`, then `pnpm nocobase config check --json`, and follow the result.     |

The full guide: https://github.com/nocobase/nocobase3/blob/develop/docs/docs/en/get-started/create-app-with-agent.md
