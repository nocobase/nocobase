# Integration Skill ownership

Each App synchronizes compatible installed package Skills through `pnpm nocobase skills sync`. The project root is Main; run there for Main and in `apps/sub/` for the sample child. Inspect `--dry-run --json` before changing ownership. `.agents/skills/` and `.claude/skills/` are generated, not editable maintenance sources.

The three multi-app scenario Skills ship with `@nocobase/app-skills`, alongside ordinary application development, upgrade and deployment guidance. Use the task routing in [application development](../skills/nocobase-app-development/SKILL.md); do not create local copies or depend on a template package to obtain guidance. Installing these Skills does not enable platform capabilities in an ordinary App.

The multi-app, identity-provider and platform-sso plugins require a commercial license and package-download access. Their integration Skills belong to the corresponding plugin packages. If required guidance is absent, verify installation, licensing, version compatibility and synchronization; do not infer private APIs or copy implementation from another repository.
