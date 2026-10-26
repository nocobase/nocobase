# Move plugin development guidance into the App

Apply this migration when the target release's `@nocobase/app-skills` contains `skills/nocobase-app-plugin-development/SKILL.md` and the target App CLI supports synchronizing that reserved name from `@nocobase/app-skills`. Inspect the target package artifacts during upgrade planning, even when the currently loaded upgrade Skill predates this migration. No fixed version number is assumed. If the App already has the replacement but global cleanup was missed, reconcile it without changing `defaultTemplateVersion` or inventing another template upgrade.

## Plan the global cleanup

Find the exact `nocobase-app-plugin-development` installation in the current user's active Agent locations. Common locations include `~/.agents/skills/`, `~/.claude/skills/` and the configured Codex home `skills/`; inspect actual Agent configuration and installer records rather than assuming that this is an exhaustive list. Check each entry with `lstat` and resolve symlink targets before planning removal. Never scan other users' homes or remove the differently named V2 `nocobase-plugin-development` Skill.

Record paths, ownership, whether entries are links or real directories, and custom changes. Global state is outside the App's Git rollback. Include the exact cleanup and a recovery location in the upgrade plan; once that plan is authorized, execute it without asking again. Back up custom or unverified content outside all Agent Skill discovery directories. Do not silently copy customized global instructions into generated project output; preserve them separately and reconcile useful App-specific rules into committed `.agents/rules/` as agreed.

## Establish the replacement first

Install the compatible target dependency set and run `pnpm nocobase skills sync` from the App root. Verify all of the following before removing any full global installation:

- The installed `@nocobase/app-skills` contains the full Skill and its linked references and resources.
- `.agents/skills/nocobase-app-plugin-development/` matches that installed package, with ownership recorded for `@nocobase/app-skills`.
- The generated `.claude/skills/nocobase-app-plugin-development` link resolves to that project copy where applicable.
- The App's `AGENTS.md` points to the project file and can be read from a plugin subdirectory.

If the target does not ship the Skill, dependencies fail to install, or synchronization rejects its name, keep the existing global installation and report the unmet prerequisite. Do not upgrade `app-skills` alone to force a match, modify synchronized files, or repeatedly rerun a failing sync. Use the target template's compatible CLI and Skills versions.

## Retire the old installation

Remove only the verified global installation and its discovery entries, using the original installer's scoped uninstall when it can target that exact Skill and the intended Agents. Inspect its help and scope before executing; do not run an unscoped remove-all operation. Otherwise unlink verified global symlinks without following them, and move real directories to the recorded backup location outside Skill discovery. Preserve a shared target needed by other entries. A global link into a source checkout or this App is only a link to remove, never permission to delete its target. Keep installer tracking consistent when supported.

`postinstall` and `pnpm nocobase skills sync` do not remove global files. Do not implement this migration as an automatic install hook. If global cleanup is outside the authorized scope or an entry's ownership is unclear, finish independent App checks and report cleanup as pending rather than claiming that the conflict is resolved.

## Verify and hand over

Recheck the active global discovery paths, the project's full Skill and its reference links. Report removed entries, preserved backups, unresolved entries and how to restore global state if the App is rolled back to a version without the replacement. Do not assume a project Skill shadows a global one; loading rules differ between Agents.

The current session may still contain the old instructions. Continue this upgrade by reading the target project files explicitly, then recommend a new Agent session rooted in the App and verify that its selected Skill path is the project copy. File synchronization alone does not prove that an already-running Agent has reloaded its catalog.
