# Editable UI in the UI Library

Plugins own runtime services, public APIs, and components whose behavior must remain consistent across upgrades. Editable source belongs in the UI Library, never in a plugin-owned `registry/` directory. Plugins do not publish `registry.config.json`, `nocobase.registry.items`, or `public/r` artifacts, and `plugin:create` has no Registry capability.

Before adding UI, inspect the UI Library catalog and reuse existing components or blocks. Add missing capabilities under `ui-library/registry/<domain>/`, using only public plugin exports and APIs. Follow [Maintaining the UI Library](../../../ui-library/MAINTAINING.md) for source layout, dependencies, translations, demos, and verification, and [Using the UI Library](../../../ui-library/USAGE.md) for installation into applications and plugins.

Within this repository, copy the files declared by the item's `registry.json` to their declared targets and retain workspace dependency ranges. Outside this repository, install with `pnpm exec shadcn add @nocobase/<item>`. Registration of a plugin and installation of editable UI are separate steps. Installed source belongs to its consumer; merge upstream changes while preserving customizations.

A plugin consuming a UI Library item compiles its installed files under `client/` and declares client value imports as peers. Keep the package-local import mappings and published `dist` targets. Do not publish another canonical recipe from the plugin.

When an item is preinstalled in a template, update that template's copy and dependencies in the same change. Keep behavior tests with the UI Library and integration tests with the consuming application or plugin. Regenerate the application Skill's offline catalog with `node scripts/gen-ui-library-catalog.mjs` after changing an item's metadata.
