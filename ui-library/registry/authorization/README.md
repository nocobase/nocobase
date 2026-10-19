# Authorization

What a role or a member may do, presented: the `permission-editor` component.

| Item                | Installs                                  | Exports            |
| ------------------- | ----------------------------------------- | ------------------ |
| `permission-editor` | `client/components/permission-editor.tsx` | `PermissionEditor` |

## Permission editor

`permission-editor` is a controlled workspace with category navigation, live search, an enabled-only filter and compact resource rows with responsive action grids. It shows one section at a time; a search spans all sections, matching category, group, row label and hint. Matching a parent includes its children. Counts in the navigator always describe the complete section. Filtering never changes the caller's draft. Give every row a stable id, label, enabled value and optional hint, levels and level. `onEnabledChange` and `onLevelChange` report only explicit user actions. `readOnly` disables writes but keeps navigation and search available. `labels` provides translated search, filter, empty-state, category, summary and scope text with English defaults. The consuming role form owns saving, conflicts and protected grants.

In a plugin, keep the `#components/ui/<name>` imports (`button`, `checkbox`, `input`, `select`, `switch`) unchanged. Ensure the plugin's `package.json#imports` and `components.json` prefixes are aligned, with local source targets for development and compiled `dist/client` targets in the published package, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.

Optional `row.scopes` places independently keyed scope selectors beside their action, without adding permission rows. Group `hint` describes the resource once. Pass `onEnabledBatchChange` to enable mixed-state group selection: it receives one batch of changed visible toggleable actions, leaving filtered-out and protected grants untouched. Apply that batch in one functional draft update. Without this callback the existing individual-edit contract remains available. Supply `labels.selectVisible` for the group checkbox name. Changes remain a draft until the host form saves them.

The registry copies source; an already installed component does not change when the site publishes. Both official application templates include this workspace. Existing applications receive its component, checkbox primitive, model, callback bindings and labels through a normal template source upgrade that preserves their business policies.

For a page resource with one access action, set `group.accessOnly` to render its title as a single checkbox, without a duplicate access label or per-resource counter. Single-action groups omit bulk selection; multi-action groups retain wrapping actions and group selection. Use localized navigation or breadcrumb titles for page resources rather than route identifiers.

Scope selectors sit beside their owning action on narrow screens and below its label on wider screens. Action grids reserve enough width for labels and scopes; compatible catalogs align semantic action columns only when there is sufficient room. A single scope does not repeat its caption visually, while multiple scopes keep their captions for disambiguation. All selectors retain action-and-scope accessible names. Group counts sit alongside the resource name. Keep scope labels localized and avoid raw collection names.

Parameterized record access must edit and persist real native parameters. The item also installs `permission-filter.tsx`, a controlled temporary input with field/operator/typed-value conditions, All/Any logic, validation and explicit Apply/Cancel. Attach it through `scope.configuration`. Selecting custom filtering should open configuration while retaining the previous selection until Apply; then put `{ type: 'recordAccess', key: 'customFilter', params: { filter } }` in the owning composite scope. An empty string grants no records; do not silently turn it into All records. The role form still owns the final save, revision check and error handling. Existing advanced filters are preserved unless explicitly reconfigured.

The host must preserve policies that are absent from the current catalog. Display an existing, unrecognized scope as a localized retained-configuration option rather than an empty selection, keep its original value until explicitly replaced, and treat selecting an already enabled permission or the current scope as a no-op. The official templates bind this behavior in their permission draft model.
