# Authorization

What a role or a member may do, presented: the `permission-editor` component.

| Item                | Installs                                  | Exports            |
| ------------------- | ----------------------------------------- | ------------------ |
| `permission-editor` | `client/components/permission-editor.tsx` | `PermissionEditor` |

## Permission editor

`permission-editor` edits what a role or a member may do, as collapsible sections (open at first) of switch rows under optional subheadings. Pass `sections`, each with `groups` of `rows`; a group's `title` becomes a subheading and a section's `footer` a note under its rows. A row has an `id` (also its switch's DOM id), a `label`, an optional `hint`, and `enabled`; give it `levels` and `level` to show how far a switched-on row reaches in the fixed right column, as a select when it offers several levels and as text when it offers one. Changes come back by row id through `onEnabledChange` and `onLevelChange`, so the consumer decides what switching on means, such as the level it starts at. `readOnly` disables every control. Every word comes through props; `labels.levelFor` names the level select for screen readers (English by default), and the component ships no locale keys.

In a plugin, keep the `#components/ui/<name>` imports (`collapsible`, `select`, `switch`) unchanged. Ensure the plugin's `package.json#imports` and `components.json` prefixes are aligned, with local source targets for development and compiled `dist/client` targets in the published package, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes.
