# JS filter toolbars

There is no dedicated `JSFilterModel`. Filter logic usually lives inside a `JSBlockModel` (or any JS-enabled block) that coordinates with a target table/list via `ctx.engine.getModel(...)`. The filter presets below are plain TypeScript modules that:

- Render a toolbar directly inside the block that hosts the JS script.
- Call `targetModel.resource.addFilterGroup(ctx.model.uid, filter)` to push filters to another block.
- Avoid external icon libraries by relying on simple emoji/text badges.
- All snippets already use plain JavaScript; do **not** import FlowModel or React.

## Available presets

Each filter snippet listed in the References block is ready to paste into your block. Copy it directly, tweak `targetBlockUid`, and adjust the JSON filters. `ctx.React` is not required here; everything is vanilla DOM.

## Usage checklist

1. Place the script inside the block that should host the toolbar. Pass `targetBlockUid` through `ctx.args` if you do not want to hard-code it.
2. Each chip definition includes a JSON filter. Update them to match your collections (`type`, `status`, `owner_id`, etc.).
3. The helper removes previous filter groups bound to `ctx.model.uid` to avoid duplicates and then refreshes the target block.
