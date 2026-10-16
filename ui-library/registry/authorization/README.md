# Authorization

What a role or a member may do, presented: the `permission-editor` component.

| Item                | Installs                                  | Exports            |
| ------------------- | ----------------------------------------- | ------------------ |
| `permission-editor` | `client/components/permission-editor.tsx` | `PermissionEditor` |

## Permission editor

`permission-editor` is a controlled workspace with category navigation, live search, an enabled-only filter and compact grouped rows. It shows one section at a time; a search spans all sections, matching category, group, row label and hint. Matching a parent includes its children. Counts in the navigator always describe the complete section. Filtering never changes the caller's draft. Give every row a stable id, label, enabled value and optional hint, levels and level. `onEnabledChange` and `onLevelChange` report only explicit user actions. `readOnly` disables writes but keeps navigation and search available. `labels` provides translated search, filter, empty-state, category, summary and scope text with English defaults. The consuming role form owns saving, conflicts and protected grants.

In a plugin, keep the `#components/ui/<name>` imports (`button`, `input`, `select`, `switch`) unchanged. Ensure the plugin's `package.json#imports` and `components.json` prefixes are aligned, with local source targets for development and compiled `dist/client` targets in the published package, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.
