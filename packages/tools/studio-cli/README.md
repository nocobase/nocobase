# @nocobase/studio-cli

`nb-studio`, the command line of NocoBase Studio (`packages/apps/studio`). It signs in to a Studio server and runs the business commands that server publishes, for people and for agents in a run. The commands are not in this package: they come from the server's command manifest, so one `nb-studio` works with every Studio it signs in to.

```bash
npm install -g @nocobase/studio-cli
nb-studio login --server https://studio.example.com
```

It needs Node.js 24 or newer. A Studio's install script installs it for you, at the version that Studio serves, and `nb-studio update` keeps it there.

Install the bundled agent Skill on your own machine with `nb-studio skills install`, or choose explicitly with `nb-studio skills install --tool all` (`claude` and `codex` can also be selected separately). Installation and `nb-studio skills status` work offline without signing in. Use `--dry-run --json` with install to preview its actions.

Claude Code uses `~/.claude/skills/nb-studio-cli` (`CLAUDE_CONFIG_DIR` moves its configuration directory). Codex uses `~/.agents/skills/nb-studio-cli`, following the [official user Skill directory](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills). `CODEX_HOME` helps detect Codex and locates legacy copies under `$CODEX_HOME/skills` (default `~/.codex/skills`); it does not move the new installation target. Status lists both new and legacy paths. Installation replaces only `nb-studio-cli`, preserving adjacent Skills, and records successful installations under `~/.nb-studio/skills.json` (`NB_STUDIO_HOME` moves this state directory).

After a successful `nb-studio update`, registered copies are synchronized from the new package. A failed Skill synchronization warns while keeping the CLI upgrade successful; a failed replacement restores the previous Skill. Unregistered manual copies are left in place with an installation reminder. Legacy copies are not created, migrated or deleted by a new installation; already registered legacy copies continue to synchronize. After `npm install -g @nocobase/studio-cli` or another external upgrade, run `nb-studio skills install` again. See Studio's [static command reference](../../apps/studio/docs/cli/static-commands.md) for detection, flags, output and filesystem constraints.

The command, its state directory (`~/.nb-studio`), its environment prefix (`NB_STUDIO_`) and its sign-in client are declared under `nocobase.cli` in `package.json`, and `skills/` holds the Skill agents read to use it. Both mirror Studio's own `nocobase.cli` and `ai/skills/nb-studio-cli`, which `nocobase cli build` packs; a test keeps them equal, so change them in Studio and copy them here.
