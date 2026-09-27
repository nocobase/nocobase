---
title: 'AI Agent application creation guide'
description: 'Instructions for an AI Agent to initialize a NocoBase 3 application in the current directory, configure it, and start it.'
---

# AI Agent application creation guide

Use this guide to create or start a **single NocoBase 3 application**. By default, initialize it in the user's current empty directory and continue configuration and startup in the same session. Continue existing applications without recreating them.

## 1. Confirm the current directory

Confirm that the current working directory is the empty directory where the user wants the application. Use it directly rather than adding another `my-app` subdirectory. Its name becomes the application name: it must start with a lowercase letter or digit and contain only lowercase letters, digits, dots, dashes, or underscores.

If it already contains the application, read its guidance and continue. If it contains other files or has an invalid name, explain the issue and ask the user to choose an appropriate empty directory. Do not overwrite files or relocate the project yourself.

## 2. Check the environment and create the project

Check Node.js 24 and pnpm 11. If a tool is missing or incompatible, stop before creating anything. Tell the user which version was found and which is required, give the command that installs it on their operating system — preferring a version manager they already use, such as `nvm install 24`, and for pnpm `corepack enable && corepack prepare pnpm@11 --activate` — and ask them to open a new shell afterwards. Install it only if they ask you to, and check both versions again before continuing. After generation, use the package manager version specified in the project's `package.json`.

These commands are for Bash on Linux or WSL. Suppose the session's directory is `/work/my-app`, which already exists and is empty. Check the environment, then run creation from `/work` with `my-app` as the target. Substitute the actual path and name.

The creation tool does not accept `.` as an application name. Running it from the parent with the current directory's name generates files directly into the empty directory. Do not create a nested project and move its files afterward.

```bash
node --version
pnpm --version
(cd /work && PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm --registry="${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}" create @nocobase/app my-app --json)
```

NocoBase 3 packages, `@nocobase/create-app` included, are published to `https://npm.nocobase.ai/`, not to the public npm, where a bare `pnpm create @nocobase/app` answers 404. `--registry` before `create` fetches `create-app` from there; `create-app` then downloads the template and installs the dependencies from the same registry, and records it in the project's `.npmrc`. Do not change the user's pnpm configuration, for example with `pnpm config set @nocobase:registry`. `NOCOBASE_REGISTRY` is set only when the shell is pointed at another registry, such as an unreleased snapshot; `create-app` reads it too. `PNPM_CONFIG_MINIMUM_RELEASE_AGE=0` applies to this command and its child processes, allowing newly published versions. `--json` never prompts: it prints one JSON result on stdout, whose `nextCommands` are the configuration and startup commands to run next.

Do not switch to NocoBase 2 installation instructions when a package cannot be found.

Wait for creation to finish and check project generation, dependency installation, and development guidance synchronization. Explain and resolve failed steps; an existing directory alone does not mean creation succeeded. Do not recreate the same project.

## 3. Complete creation and startup in the current session

The subshell changes the directory only for the creation command; the session remains rooted in the application directory. After creation, explicitly read the generated `AGENTS.md` and relevant development guidance, then continue configuration. Do not assume that new instructions loaded automatically.

After creation and startup, recommend that the user start a new session in the application directory before continuing development. NocoBase synchronizes the development Skills into `.agents/skills/` in the project directory, and they appeared after the current session started, so it may not have loaded them; a new session loads them reliably. If the user keeps working in the current session, follow `AGENTS.md` and read the relevant `.agents/skills/<name>/SKILL.md` directly rather than relying on them being loaded. When the application is in the session's own directory, ending the session and starting a new one there is enough. If the user chose a different application directory, give its actual path and the command that starts the agent there, for example `cd /work/my-app && claude`, and ask them to end the current session first. In a desktop client, open or create the project for that directory and start a new session.

## 4. Confirm the database and configuration

Confirm that the working directory is the application root. Read `AGENTS.md`, `package.json`, and relevant local development guidance. Inspect existing configuration and continue unfinished work.

Use the database the user named; otherwise ask which one they want, and do not choose it for them. Common options include SQLite, PostgreSQL, and MySQL. SQLite uses a local file; PostgreSQL and MySQL require a reachable database service. For other databases, consult the project's current database guidance for the driver and connection requirements.

After the user chooses, configure the application from its own directory. SQLite needs nothing installed, because the templates depend on its driver:

```bash
pnpm nocobase config init --dialect sqlite --json
```

Any other database needs its driver first, for example `pnpm add @nocobase/db-postgres`, and then the same command with that dialect. `pnpm nocobase config init` installs nothing and writes nothing when the driver is missing: it fails with `error.code` `DRIVER_MISSING`, and `error.suggestions[0].run` is the `pnpm add` that supplies it, so run that and run `config init` again. A dialect name in configuration does not supply a driver. `result.requiredSettings` lists the connection settings still at a placeholder, which you then set:

```bash
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm --json
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD --json
```

Have the user put the password in an environment variable and pass its name with `--from-env`. Do not ask for passwords in the conversation, pass them on the command line, or print complete configuration files. Then verify the configuration, which also connects to the database:

```bash
pnpm nocobase config check --json
```

A failed check lists each problem with a `fix` to run. Preserve existing business data; do not delete a database or configuration file to make configuration run again — `config init` on a configured application reports `status: "success-noop"`, and `--force` replaces it only when the user asks. Generated applications have no installation web page, and `pnpm dev` refuses to start until the application is configured.

## 5. Start the application and provide sign-in instructions

Start the development service from the application root using its project script:

```bash
pnpm dev
```

`pnpm dev` does not exit, so run it in the background. Inspect the actual URL in its output and confirm that the page opens by requesting it, for example with `curl -I`, and expecting a successful response. Complete required installation or configuration before checking the sign-in page. A reachable installation page alone does not mean initialization is complete.

Provide the user with:

- The application directory and actual URL
- The account to use for first sign-in and where to obtain its password
- That the service started by the agent stops when the agent's session ends, and how to start it again with `pnpm dev` in the application directory
- Any remaining configuration tasks or startup errors

If the template uses its initial administrator, the account is `admin@nocobase.com` with password `admin123`; confirm this against the generated project's account guidance before presenting it. If the user configured an administrator or connected an existing database, use the actual account information instead of assuming the defaults. Do not repeat user-defined passwords in the conversation.

Remind the user to change the template's initial password after first sign-in. Start a new session in the application directory and continue with [your first feature](./first-feature).
