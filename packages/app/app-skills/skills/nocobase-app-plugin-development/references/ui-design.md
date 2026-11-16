# Shared UI design and host acceptance

Plugin UI and application UI follow one design contract, owned by the `nocobase-app-development` Skill that ships beside this one in `@nocobase/app-skills`. Read [the design contract](../../nocobase-app-development/references/frontend/design-contract.md), then the relevant parts of [UI guidelines](../../nocobase-app-development/references/frontend/ui-guidelines.md), [phone layout](../../nocobase-app-development/references/frontend/mobile.md), [the UI workflow](../../nocobase-app-development/references/frontend/ui-workflow.md) and [UI acceptance](../../nocobase-app-development/references/frontend/ui-acceptance.md). Plugin pages and overlays meet the same phone experience inside the host's shell. These are documentation paths, never runtime imports.

If an installed App's synchronized copy is missing, synchronize it with `pnpm nocobase skills sync`. If the installed `@nocobase/app-skills` predates these documents, keep its compatible guidance and report the missing contract instead of downloading newer guidance with different APIs.

## Use the host's design, keep plugin ownership

A plugin inherits the host's tokens, density, navigation context and repeated interaction patterns. A plugin's own design covers only its surface; it does not change host globals, replace the shell or restyle unrelated plugins.

When developing a reusable plugin without a particular host, use a representative fixture App and NocoBase defaults. Keep generic plugin requirements separate from one host's overrides, and do not bake a host's brand or business terminology into every consumer. Report which host configurations were verified.

## Adapt the workflow, not its implementation examples

Use the shared workflow (change an existing page, or plan and build a new one with independent acceptance) with these plugin substitutions:

- Point reviewers at the owning plugin's files and the selected host, not application-only paths. For a host theme change, work in the App's theme mechanism; the plugin consumes the tokens.
- For components, installation and public imports, follow [Client components](client-components.md) and [theme tokens](theme-tokens.md). Use plugin-owned source or documented public exports, never private host components.
- For pages, menus, Tabs, overlays and return paths, follow [Client routing](client-routing.md), [page structure](client-pages-and-routes.md) and [child routes](client-child-routes.md). The shared visual patterns do not permit new runtime APIs or App-only imports.
- For settings, keep [system settings](system-settings.md) ownership and authorization boundaries.
- For copy, use [plugin internationalization](i18n.md), including every supported language, rather than assuming the host's locale keys exist.
- For checks, use [testing and delivery](testing.md). Do not run the App workflow's application-only commands in the plugin or rewrite host routes to imitate an App example.

## Verify component reuse

Follow the component selection order in [the design contract](../../nocobase-app-development/references/frontend/design-contract.md) and run its checker with the plugin as root. From an App root: `node .agents/skills/nocobase-app-development/scripts/check-ui-components.mjs --root packages/<plugin> <changed-client-paths-relative-to-plugin>`; a standalone plugin uses the synchronized script from its fixture App. Run it against plugin-owned source, not just a host page that mounts it, and review every printed exception and the cases the checker cannot detect. Missing dependencies or parse errors are an incomplete check, not a pass.

## Verify the assembled system

Run the shared acceptance inside the host: keyboard and focus, nested overlays, translated long labels, phone width and affected cross-module return paths. Verify host theme and density changes do not break the plugin, and plugin styles do not alter the surrounding host UI. Report unavailable host or browser evidence as not verified, never as a pass inferred from a package build. Never put product decisions in synchronized Skills or erase a host's records during plugin upgrades.
