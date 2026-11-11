# Multi-app template maintenance

This directory is a template packaging tool, not the generated Main application. Follow the repository's `AGENTS.md`; the App source payload is `template/`, with Main at its root and the child at `template/apps/sub/`. Build and pack the wrapper to produce a complete root Main application in `dist/`; never edit generated `dist/`.

The wrapper declares only its tooling dependencies. Keep commercial runtime dependencies in the inert application payload, not the OSS workspace installation graph. Preserve every historical migration and seed byte and keep Main/Sub business source imports isolated. Validate the real tarball and create-app output, not just this directory.

Maintain OSS dependencies with the same `workspace:^` / `workspace:*` and `catalog:` declarations as Default. The builder uses pnpm's workspace inventory to create disposable OSS package links, then runs native `pnpm pack` for Sub and Main separately against the repository's catalog. It copies back only the resolved manifests and removes all staging links; never add a manual version table, copy the catalog, or install commercial dependencies while packaging. Commercial plugin versions remain explicit compatible registry releases.

Shared scenario guidance belongs to [`@nocobase/app-skills`](../../app/app-skills/skills/nocobase-app-development/SKILL.md), whose existing application-development entry routes to the three multi-app Skills. Do not maintain a second template-local copy or add custom project-source synchronization. Plugin API guidance stays in its owning plugin package.
