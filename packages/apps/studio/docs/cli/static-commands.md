# Local Skill commands

These static commands are available when the CLI package ships `skills/nb-studio-cli/SKILL.md`. They require no login and make no network requests. They manage only the `nb-studio-cli` directory and preserve adjacent Skills.

## `nb-studio skills install`

```bash
nb-studio skills install
nb-studio skills install --tool all
nb-studio skills install --tool claude --tool codex
nb-studio skills install --tool codex --dry-run --json
```

| Flag                        | Meaning                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--tool claude\|codex\|all` | Explicit selection; repeatable. Creates the selected tool's Skill directory even when the tool has not been detected. |
| `--dry-run`                 | Computes `install`, `update` or `unchanged` without creating directories, locks or installation records.              |
| `--json`                    | Prints one CLI envelope with the payload under `result.data`; a dry run has `status: success-noop`.                   |

Without `--tool`, detection uses a nonempty `CLAUDE_CONFIG_DIR` / `CODEX_HOME`, the corresponding configuration directory, or an executable `claude` / `codex` on PATH. The shared `.agents/skills` directory alone is not evidence that Codex is installed. No detected tool yields exit code 5, `error.code: SKILLS_NO_TOOL`, and executable suggestions with an explicit `--tool`.

| Tool        | New installation                                        | Compatibility location                          |
| ----------- | ------------------------------------------------------- | ----------------------------------------------- |
| Claude Code | `<CLAUDE_CONFIG_DIR or ~/.claude>/skills/nb-studio-cli` | None                                            |
| Codex       | `~/.agents/skills/nb-studio-cli`                        | `<CODEX_HOME or ~/.codex>/skills/nb-studio-cli` |

The paths follow [Claude Code's personal Skills](https://code.claude.com/docs/en/skills#where-skills-live) and [Codex's user Skills](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills). `CODEX_HOME` is a Codex state-directory and detection convention, not an override for the new user Skill destination. New installation never creates, migrates or deletes a legacy copy. Relative configuration directory values resolve against the current working directory.

Contents are compared using a SHA-256 digest of sorted relative paths, directory entries and file contents, including supporting files. The CLI version is informational; matching contents determine `upToDate`. Repeated installation leaves an identical Skill directory untouched and refreshes its installation record. An outdated copy is replaced as a whole, removing obsolete files within that copy. Before writing any target, install compares the complete plan with registered destinations and refuses parent/child overlaps with `SKILLS_TARGET_OVERLAP` (exit 5); dry-run performs the same check without writing. Equal normalized paths represent one destination. Each nonconflicting target is committed separately; if a later target fails, earlier successful installations remain registered.

Installation records live in `~/.nb-studio/skills.json` (`NB_STUDIO_HOME` moves this CLI state directory). Source, target, parent and record paths containing symbolic links or unexpected file types are refused; nested links and special files within a Skill are also refused. Package and CLI-state overlap is refused. Staging and backups stay next to the target on the same filesystem. Failure during replacement or record commit restores the previous copy. If recovery itself fails, its backup is retained for manual recovery. Concurrent CLI operations use a state lock and a per-destination lock; `SKILLS_BUSY` exits 6. After an interrupted operation, inspect the named lock and any `.nb-studio-cli-stage-*` backup before removing the lock and retrying; active locks are never automatically stolen. Do not change these directories concurrently with installation.

Agent run contexts yield exit code 3, `SKILLS_RUN_FORBIDDEN`; the runner already supplies the Skill. `--dry-run` is also refused inside a run. Status remains available.

`result.data` contains `skill`, `cliVersion`, `hash`, `dryRun`, and `targets`. Every target has `tool`, absolute `path`, `legacy`, `registered`, `present`, `upToDate`, `action` (`install`, `update`, `unchanged`) and, when registered, `installedCliVersion`. For a real install these describe the resulting copy; for a dry run they describe the existing copy and planned action.

## `nb-studio skills status`

```bash
nb-studio skills status
nb-studio skills status --tool codex --json
```

Accepts the same repeatable `--tool` filter and `--json`. It scans both tools' default paths, the Codex compatibility path, and registered paths (including paths recorded before a configuration variable changed). Without a filter it reports all of them, even if the tool is not detected. It never writes files and does not support `--dry-run`.

`result.data` contains `skill`, `cliVersion`, `hash` and `targets`. Targets have `tool`, absolute `path`, `legacy`, `registered`, `present`, `upToDate`, optional `installedCliVersion` and optional `error`. Unsafe copies are reported with `error` and `upToDate: false`. New and legacy copies appear separately when both exist; a manual copy can match the bundled contents while still having `registered: false`.

## Skill synchronization during `nb-studio update`

After a successful CLI upgrade, registered destinations, including registered legacy paths, synchronize from the new tarball root or npm package root. Nested registered destinations are identified before replacement; all conflicting copies and their records stay unchanged with failed synchronization results and warnings, while unrelated destinations continue to synchronize. Correct the configuration and conflicting installation records before retrying installation. Unregistered default and legacy copies remain untouched and produce a reminder to run `nb-studio skills install`. A new Codex install registers only the new user directory; it does not adopt the legacy copy.

Skill synchronization failures leave the CLI upgrade successful and add stderr warnings and envelope `warnings`, each containing an installation command. The existing update payload gains optional `result.skills` with `targets` (`tool`, `path`, `action: updated|unchanged|failed`, optional `error`) and `warnings`. `update --check` does not synchronize. Machines without any installed copies create no Skill state or tool directories during update.

After `npm install -g @nocobase/studio-cli` or another external upgrade, run `nb-studio skills install` again: those upgrades do not execute the self-update synchronization. Use status to identify remaining unregistered or outdated legacy copies; manage a manual legacy copy yourself if you no longer need it.

## My Agent sessions

`nb-studio acp start` pins each session agent to the bridge's signed-in profile through `NB_STUDIO_PROFILE` and identifies the Studio session with `NB_STUDIO_AGENT_SESSION`. The CLI reads the selected stored profile directly in this mode, ahead of run-directory identity or environment API keys; missing profiles or attempts to select another profile fail explicitly. No new session credential or repository file is created.

Before starting or restoring a session, the CLI installs or updates its packaged `nb-studio-cli` Skill in the selected agent's personal Skill directory. Automatic installation currently supports Codex and Claude Code. Other agents receive an explicit unsupported-tool message and the session does not start. Installation failures also stop opening the session. Settings discovery remains prompt-free.

The CLI includes the session id in `x-nb-agent-session`. `issue create` checks that the signed-in caller owns an active session before its existing issue permission check and creation path, defaults an omitted project to the session's project, and links successful creation with the existing association transaction. A session without a project requires an explicit project. The default status remains Backlog. An invalid, foreign or archived session is refused without falling back to ordinary creation. Ordinary non-session CLI identity and creation behavior remain unchanged.

`nb-studio session work` reads `NB_STUDIO_AGENT_SESSION` when no session argument is given; an explicit session argument also works. It checks ownership, resolves only visible linked work and reuses the application's batch progress calculation. `issue get` includes progress facts: who works on it, waiting reason and pull request when known. Neither command starts automatic polling. Bridge polling and runner claiming are unchanged. Protocol 3 removes the former MCP tools field and endpoint; old bridges receive the existing upgrade-required message.
