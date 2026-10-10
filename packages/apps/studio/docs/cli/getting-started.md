# Getting started with `nb-studio`

`nb-studio` is Studio on the command line. It ships no business commands of its own: once you are signed in it asks the server which commands you may run (`GET /api/cli/manifest`), and every one of them is a request to one API route, so the commands follow the server's version and your permissions. The [command reference](reference/index.md) lists every command; [coverage](coverage.md) says what stays in the web page.

## Install

`nb-studio` runs on the machine's own **Node.js 24 or newer**, which has to be installed first (https://nodejs.org/en/download, or `nvm install 24`), with the `npm` that comes with it. A published Studio serves no tarball of its own: it names the exact version of `@nocobase/studio-cli` (and of the runner, `@nocobase/agent-runner`) it was built with, and the install script installs that version from npm, with your npm configuration (registry, proxy). A Studio that has tarballs in its storage serves those instead. The install script also needs `curl`, runs on macOS and Linux (WSL on Windows), and never asks for `sudo`; it stops before installing anything, saying what to install, when Node.js 24 or npm is missing.

The quickest way is from the home page: "Use Studio in your agent" (「在你的 Agent 中使用 Studio」) under the composer gives a prompt to paste into a coding agent such as Claude Code or Codex. It carries a download token Studio has just created for you, valid for 30 minutes and for the CLI alone; the agent installs `nb-studio`, runs `nb-studio login` and asks you to confirm the code in your browser. To install it yourself, run the same line:

```bash
curl -fsSL https://studio.example.com/api/agents/dist/installScript | sh -s -- --token <download token>
nb-studio login --server https://studio.example.com
```

It puts `nb-studio` in `~/.local/share/nb-studio/versions/<version>` (the package Studio's build packed, or `node_modules/@nocobase/studio-cli` from npm on a Studio without one, and a launcher in `bin/`, which runs it on the Node.js the script found, linked as `~/.local/share/nb-studio/node`) and links `~/.local/bin/nb-studio` to it (`--prefix`, `--bin-dir` move them; `--dry-run` shows what it would do). A download token downloads the CLI for one platform, three times at most, and registers nothing; to make a machine a runtime as well, use Agent team › Runtimes › Add runtime, whose line adds `--runner` and a registration token: it also installs the runner, `nocobase-runner`, in `~/.local/share/nocobase-runner` (`--runner-prefix`), registers it and starts it as a user service, or with `--no-service` registers it without starting it. The CLI install directory can also be set with `NOCOBASE_CLI_INSTALL_DIR`; the runner and command-link directories use `NOCOBASE_RUNNER_INSTALL_DIR` and `NOCOBASE_CLI_BIN_DIR`. `NB_STUDIO_HOME` moves the CLI's state directory; it does not change where the CLI is installed. A token of the other kind is refused before anything is installed. In this repository, `pnpm nocobase cli link` makes `nb-studio` a command in `node_modules/.bin` (`pnpm exec nb-studio`; `--bin-dir ~/.local/bin` puts it on your PATH) that runs from the sources.

### Update

```bash
nb-studio update           # the newest nb-studio the server serves for this platform
nb-studio update --check   # only say whether there is one
```

`nb-studio update` asks the server you are signed in to which version it names, installs it beside the running one (with npm, or from the server's tarball, checking its SHA-256), switches to it and keeps the previous version beside it. `nb-studio login` and business commands print a line when a newer version is served, at most every 12 hours. The runner is installed and updated apart: it updates itself between runs, and `nocobase-runner update` updates it now.

### Where the CLI and the runner come from

A deployed Studio serves `nb-studio` and `nocobase-runner` from its own build: `pnpm build` packs both, as universal packages without Node.js, into `dist/runners/stable/<product>/`, at the versions it records in `dist/server/agents/served-versions.json` (`nb-studio` at `@nocobase/studio-cli`'s version, the runner at `@nocobase/agent-runner`'s), and fails when they differ. Packing installs their dependencies with npm, so the build needs the npm registry. `NB_STUDIO_RUNNERS_DIST` or `agents.dist.dir` in `config.yml` serve another directory instead.

A Studio started from this repository with `pnpm dev` has no build, so it names the same versions on npm, where they exist only once released. To try unreleased ones, serve packages from its storage, `storage/runners/dist` (`agents.dist.dir` moves it), which win over npm. Build them by hand in this repository. `cli build` packs `nb-studio` as `package.json` declares it under `nocobase.cli`, and `cli build --runner` packs `nocobase-runner`; `--targets` narrows the platforms to the ones you need, `--host-node` uses this machine's Node.js for its own platform instead of downloading it, `--universal` packs one tarball without Node.js for every platform, and `--version` packs a later version to try `nb-studio update`:

```bash
pnpm nocobase cli build --targets darwin-arm64 --host-node
pnpm nocobase cli build --runner --targets darwin-arm64 --host-node
```

Each product goes in a directory of its own with its own manifest, `storage/runners/dist/stable/<product>/manifest.json` (`--out` writes elsewhere), and Studio serves the highest version of each.

## Sign in

```bash
nb-studio login --server https://studio.example.com
```

`nb-studio login` prints a code such as `WXYZ2345` and opens Studio's approval page (`/device?user_code=…`) in your browser. Sign in there if you are not, check that the code matches your terminal, and choose Approve. The CLI then holds a session of its own (Better Auth's device authorization, RFC 8628), with your own permissions, and keeps its token in the system keychain (the macOS Keychain, the Secret Service on Linux, the Windows Credential Manager; `~/.nb-studio/config.json`, 0600, with a warning where there is none). The session lasts seven days and is renewed while you use the CLI, so a CLI in daily use stays signed in; after a week unused, run `nb-studio login` again. Without a browser on this machine, `--no-browser` prints the address: open it anywhere you are signed in.

To sign in with an API key you created yourself instead, for example on a machine where no one can approve a code:

```bash
nb-studio login --server https://studio.example.com --api-key-stdin < key.txt
```

## Who am I

```bash
nb-studio whoami            # server, user, profile, when the session expires, the actions you hold
nb-studio whoami --missing  # the commands that need an action you do not hold, by action
```

A command you are not offered says why instead of "unknown command": `nb-studio issue delete PM-1` answers that it needs the action `pm.issues/delete`, which you do not hold, and an agent's command says it is only for agents.

## Profiles

Each server you sign in to is a profile; the first is `default`, and the last one you signed in to is current.

```bash
nb-studio login --server https://staging.example.com --profile staging
nb-studio profile list
nb-studio profile use default
nb-studio issue search --profile staging --q login   # one command as another profile
nb-studio profile remove staging                      # forget it here; the session or key stays valid on the server
```

`NB_STUDIO_PROFILE` chooses a profile too. `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` act without signing in at all, which is how CI works ([CI](ci.md)).

## Sign out

```bash
nb-studio logout                  # the current profile
nb-studio logout --profile staging --dry-run
```

`logout` forgets the credential here and ends the session `nb-studio login` received on the server. A key you created yourself and passed with `--api-key-stdin` stays valid: revoke it where you created it.

## Finding commands

```bash
nb-studio --help                  # the static commands and every business command you may run
nb-studio issue --help            # the commands of an area
nb-studio issue comment add --help
nb-studio docs                    # how the CLI works, and the areas
nb-studio docs issue comment add  # a command's arguments, output, permission, request and examples
```

Shell completion reads the commands the server last offered you, so it works offline and follows your permissions:

```bash
nb-studio completion zsh > "${fpath[1]}/_nb-studio"                     # zsh
echo 'source <(nb-studio completion bash)' >> ~/.bashrc              # bash
nb-studio completion fish > ~/.config/fish/completions/nb-studio.fish # fish
```

## Every command takes

| Flag               | Meaning                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `--json`           | One JSON document on stdout, success or failure: `{ schemaVersion, ok, command, status, result \| error, warnings }` |
| `--profile <name>` | Act as that profile                                                                                                  |
| `-y`, `--yes`      | Go ahead without asking; a command that asks refuses without a terminal unless given                                 |
| `--dry-run`        | Change nothing; passed to a command whose route offers a dry run (`plan undo`), refused by every other               |
| `-q`, `--quiet`    | Print nothing on success but `--json`'s document                                                                     |
| `--no-color`       | Plain text                                                                                                           |

A missing argument is asked for in a terminal; without one the command fails with `MISSING_ARGUMENT` and suggestions naming what to pass. A business command's `--json` result is the API's answer, so a script reads `.result.data`; a failure's `.error.code` is the API's reason. Exit codes: 0 ok, 1 general, 2 network, 3 authentication or permission, 4 not found, 5 invalid input, 6 conflict, 7 a plan is required.
