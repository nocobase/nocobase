# Shared UI design and host acceptance

Plugin UI and application UI follow one design contract. This Skill and `nocobase-app-development` ship together in `@nocobase/app-skills`; there is no extra design Skill to install and no second copy of the shared rules to maintain.

## Find the shared documents

In an installed App, read `.agents/skills/nocobase-app-development/references/frontend/design-contract.md`, then the relevant sections of `ui-guidelines.md`, `ui-workflow.md` and `ui-acceptance.md` in that same directory. In a NocoBase source checkout, read them at `packages/app/app-skills/skills/nocobase-app-development/references/frontend/` from the repository root; that App-only Skill is not linked into the repository's Agent directories. These are documentation paths, never runtime imports.

For an installed App whose synchronized copy is missing, inspect the installed `@nocobase/app-skills` package and synchronize through the App's existing `pnpm nocobase skills sync` command. If that package predates these documents, keep its compatible guidance and report the missing shared contract instead of downloading latest guidance with potentially different APIs. An App does not need a source checkout. In a source checkout, use its package source directly.

## Use the host's design, keep plugin ownership

Read the target App's existing design records and original references, normally `docs/ui/design-system.md` and `docs/ui/pages/<feature>.md`. A plugin inherits the host's tokens, density, navigation context and repeated interaction patterns. A plugin-specific reference defines only its intended surface; it does not authorize changing host globals, replacing the shell, or restyling unrelated plugins.

When developing a reusable plugin without a particular product host, use a representative supported fixture and NocoBase defaults. Retain portable decisions in the plugin's own `docs/ui/` only when needed. Separate generic plugin requirements from one host's page overrides; do not bake that host's brand or business terminology into every consumer. Record which host configurations were verified.

Use the shared reference modes, priority order and authorized-exception mechanism. User-approved visual choices can replace default layout choices while preserving usability, authorization, correct data and host integration. Resolve conflicts at design time instead of silently reverting the reference to a default component layout.

## Adapt the workflow, not its implementation examples

Use the shared workflow's quick/theme/full classification, design/review templates, reference comparison, decision retention and acceptance outcomes. The same existing user authorization applies; this is not an additional review or approval round. For a host theme change, work in the App's theme mechanism; the plugin itself consumes the tokens.

- Replace application-only paths in reviewer prompts with the owning plugin's actual files and the selected host. Read original reference assets and authorized exceptions in both design and acceptance review.
- For components, installation and public imports, follow [Client components](client-components.md) and [theme tokens](theme-tokens.md). Use plugin-owned source or documented public exports, not private host components. Consult the embedded shadcn rules through the shared integration guide; the plugin's local generation and ownership instructions take precedence over App-specific commands there.
- For pages, menus, Tabs, overlays and return paths, follow [Client routing](client-routing.md), [page structure](client-pages-and-routes.md) and [child routes](client-child-routes.md). The shared visual patterns do not permit new runtime APIs or App-only imports.
- For settings, keep [system settings](system-settings.md) ownership and authorization boundaries; a UI reference does not create a plugin settings-page route API.
- For copy, use [plugin internationalization](i18n.md), including all supported plugin languages, rather than assuming the host's locale keys exist.
- For implementation checks, use [testing and delivery](testing.md). Do not run the App workflow's application-only commands in the plugin or rewrite host routes to imitate an App example.

## Verify the assembled system

Apply the shared acceptance checks inside the host, including reference fidelity, actual footer geometry, keyboard/focus behavior, nested overlays, translated long labels, and affected cross-module return paths. Verify theme and density changes do not break the plugin, and plugin styles do not alter surrounding host UI. Keep focused browser regression coverage when changing a shared overlay. Record unavailable host/browser evidence as Not verified, not a pass inferred from a package build.

Persist reusable decisions in the appropriate App or plugin documentation before removing temporary workflow records. Never put product decisions in synchronized Skills or erase a host's records during plugin upgrades.
