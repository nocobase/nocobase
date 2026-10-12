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

Contents are compared using a SHA-256 digest of sorted relative paths, directory entries and file contents, including supporting files. The CLI version is informational; matching contents determine `upToDate`. Repeated installation leaves an identical Skill directory untouched and refreshes its installation record. An outdated copy is replaced as a whole, removing obsolete files within that copy. Each target is committed separately; if a later target fails, earlier successful installations remain registered.

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

After a successful CLI upgrade, registered destinations, including registered legacy paths, synchronize from the new tarball root or npm package root. Unregistered default and legacy copies remain untouched and produce a reminder to run `nb-studio skills install`. A new Codex install registers only the new user directory; it does not adopt the legacy copy.

Skill synchronization failures leave the CLI upgrade successful and add stderr warnings and envelope `warnings`, each containing an installation command. The existing update payload gains optional `result.skills` with `targets` (`tool`, `path`, `action: updated|unchanged|failed`, optional `error`) and `warnings`. `update --check` does not synchronize. Machines without any installed copies create no Skill state or tool directories during update.

After `npm install -g @nocobase/studio-cli` or another external upgrade, run `nb-studio skills install` again: those upgrades do not execute the self-update synchronization. Use status to identify remaining unregistered or outdated legacy copies; manage a manual legacy copy yourself if you no longer need it.
