---
name: nocobase-app-plugin-development
description: Migrate an older global NocoBase 3 plugin development Skill to the version supplied by the current App. Use when this legacy global entry is selected; it forwards to project guidance and contains no plugin implementation instructions.
---

# Use the project's plugin development Skill

The complete `nocobase-app-plugin-development` Skill is maintained in `@nocobase/app-skills` and delivered with compatible App releases. This global entry is a migration bridge, not an implementation guide. Do not assume that an installed App already includes the new Skill or that a project Skill automatically overrides a global one.

Find the owning App from the current directory and its ancestors, read its `AGENTS.md`, then open `<app-root>/.agents/skills/nocobase-app-plugin-development/SKILL.md` by its explicit path. Resolve symlinks and confirm this is a different file from this bridge. Do not invoke this Skill again by name. Follow the complete project Skill and its references for implementation.

If that file is missing, check whether the installed `@nocobase/app-skills` actually ships it before running `pnpm nocobase skills sync` from the App root. If it does not, do not repeatedly sync or install a newer `app-skills` in isolation. Explain that a compatible App release is required, read the project's `nocobase-app-upgrade` Skill, and upgrade only within the user's requested scope. Until a compatible release is available, use the installed App's guidance and public package declarations; report missing guidance rather than inventing APIs. Do not remove an existing full global copy before a working project replacement is available.

For work explicitly in the NocoBase source repository, read `packages/app/app-skills/skills/nocobase-app-plugin-development/SKILL.md` and `.agents/rules/plugin-development.md` from that repository root. No source download is required for an App. With no App, use the available `nocobase-create-app` entry first.

After the project replacement is verified, retire this exact global installation and its Agent discovery links as part of the agreed migration. Inspect real paths, preserve custom content outside Skill discovery directories, and never follow a global symlink to delete a source checkout or project copy. Do not remove the differently named V2 Skill or unrelated Skills. Report any remaining global entries and start a new Agent session after cleanup; this session can continue by reading the project file directly. Detailed migration guidance ships with the target release's `nocobase-app-upgrade` Skill.
