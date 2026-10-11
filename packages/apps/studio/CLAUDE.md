@AGENTS.md

For UI styling and for creating or editing theme presets, read `.agents/skills/nocobase-app-development/references/frontend/references/theme.md` (from the application root). It defines the shared color, font, size, spacing, radius and shadow contract; prefer its Tailwind utilities so components respond to theme changes, and keep deliberate fixed-size exceptions explicit.

## Compiled migration and seed manifests

The application build generates `.manifest.json` in each compiled migrations and seeds directory after server compilation, path rewriting, and `afterServerBuild` hooks. Keep the manifest generator in the build when customizing it. Plugins generate their own manifests when built; an application must not regenerate manifests for installed dependencies.

TypeScript and compiled JavaScript use the same source checksum for migration history, while the loader separately verifies emitted JavaScript. Marked JavaScript requires its manifest. For a database with old raw JavaScript checksums, first run the compiled representation with matching original output; verified legacy hashes are converted under the task lock. Unreproducible old output remains an error. Never edit historical migrations, and never edit the history table by hand, to resolve an upgrade failure; `pnpm nocobase db repair` is the supported way to realign a checksum you can account for, and `pnpm nocobase db redo` the way to re-run a migration whose branch is still unmerged.
