# Authorization

Role administration presentation: the compact `role-list` and the `permission-editor` workspace.

| Item                | Installs                                  | Exports            |
| ------------------- | ----------------------------------------- | ------------------ |
| `role-list`         | `client/components/role-list.tsx`         | `RoleList`         |
| `permission-editor` | `client/components/permission-editor.tsx` | `PermissionEditor` |

## Permission editor

`permission-editor` is a controlled workspace with category navigation, live search, an enabled-only filter and compact resource rows with responsive action grids. It shows one section at a time, using the selected category as the visible context without repeating its heading in the content pane. Filtered views show category headings to identify their results, and sections retain accessible names in either mode; a search spans all sections, matching category, group, row label and hint. Matching a parent includes its children. Counts in the navigator always describe the complete section. Filtering never changes the caller's draft. Give every row a stable id, label, enabled value and optional hint, levels and level. `onEnabledChange` and `onLevelChange` report only explicit user actions. `readOnly` disables writes but keeps navigation and search available. `labels` provides translated search, filter, empty-state, category, summary and scope text with English defaults. The consuming role form owns saving, conflicts and protected grants.

In a plugin, keep the `#components/ui/<name>` imports (`button`, `checkbox`, `input`, `select`, `switch`) unchanged. Ensure the plugin's `package.json#imports` and `components.json` prefixes are aligned, with local source targets for development and compiled `dist/client` targets in the published package, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.

Optional `row.scopes` places independently keyed scope selectors beside their action, without adding permission rows. Group `hint` describes the resource once. Pass `onEnabledBatchChange` to enable mixed-state group selection: it receives one batch of changed visible toggleable actions, leaving filtered-out and protected grants untouched. Apply that batch in one functional draft update. Without this callback the existing individual-edit contract remains available. Supply `labels.selectVisible` for the group checkbox name. Changes remain a draft until the host form saves them.

The registry copies source; an already installed component does not change when the site publishes. Both official application templates include this workspace. Existing applications receive its component, checkbox primitive, model, callback bindings and labels through a normal template source upgrade that preserves their business policies.

For a page resource with one access action, set `group.accessOnly` to render its title as a single checkbox, without a duplicate access label or per-resource counter. Single-action groups omit bulk selection; multi-action groups retain wrapping actions and group selection. Use localized navigation or breadcrumb titles for page resources rather than route identifiers.

Scope selectors remain in their owning action cell, sitting beside the label when the cell has room and below it when narrow. Action grids reserve enough width for labels and scopes; compatible catalogs align semantic action columns only when there is sufficient room. When a category includes actions with multiple scopes, every scope shows its caption above its control when the controls are shown; otherwise single scopes keep the compact caption-free layout. All selectors retain action-and-scope accessible names. Group counts sit alongside the resource name. Keep scope labels localized and avoid raw collection names.

Parameterized record access must edit and persist real native parameters. The item also installs `permission-filter.tsx`, a controlled temporary input with field/operator/typed-value conditions, All/Any logic, validation and explicit Apply/Cancel. Attach it through `scope.configuration`. Selecting custom filtering should open configuration while retaining the previous selection until Apply; then put `{ type: 'recordAccess', key: 'customFilter', params: { filter } }` in the owning composite scope. An empty string grants no records; do not silently turn it into All records. The role form still owns the final save, revision check and error handling. Existing advanced filters are preserved unless explicitly reconfigured.

The host must preserve policies that are absent from the current catalog. Display an existing, unrecognized scope as a localized retained-configuration option rather than an empty selection, keep its original value until explicitly replaced, and treat selecting an already enabled permission or the current scope as a no-op. The official templates bind this behavior in their permission draft model.

Permission actions use regular body text and compact resource rows. Categories without data ranges align up to six semantic action columns when the container has room, leaving gaps for missing actions. Unrelated special actions share trailing slots instead of widening every resource; a resource with one action uses the available row width. Scoped actions retain wider columns. An enabled action with several scopes exposes them through an expandable summary; `labels.dataRanges(count)` customizes its text (English: `Data ranges (2)`, Chinese: `数据范围（2）`). Expanding or collapsing only changes presentation and never changes the saved grants or scope values.

## Role list

`role-list` presents roles as compact content rows with body-sized names, muted identifiers, small state badges and a plain shield icon. Wide containers align name, identifier and state in three columns; narrow containers put the identifier below its name. Long names and identifiers truncate visually and retain their full text in the DOM and native title. Rows stay keyboard-accessible links.

Render `RoleList` inside React Router. Supply `roles` with stable `key`, localized `title`, a `to` destination and a `protected` boolean; pass localized `labels.protected` and `labels.custom`, and an optional `ariaLabel` for the list. The component owns no loading, search, sort, authorization, persistence or empty state; the host role page keeps those responsibilities. It introduces no translation keys.

Both templates preinstall the source and use it in `client/pages/settings/roles.tsx`. New applications receive it when created from the updated template. Existing applications receive both the new component and the role-page integration through a template source upgrade; Registry publication or dependency updates alone do not replace installed source. Preserve application-owned role fields, routes, grants and page behavior when reconciling an existing application.
