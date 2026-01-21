# JS filter toolbars

There is no dedicated `JSFilterModel`. Filter logic usually lives inside a `JSBlockModel` (or any JS-enabled block) that coordinates with a target table/list via `ctx.engine.getModel(...)`. The filter presets below are plain TypeScript modules that:

- Render a toolbar directly inside the block that hosts the JS script.
- Call `targetModel.resource.addFilterGroup(ctx.model.uid, filter)` to push filters to another block.
- Avoid external icon libraries by relying on simple emoji/text badges.
- All snippets already use plain JavaScript; do **not** import FlowModel or React.

## Available presets

Each file contains a ready-to-run snippet. Copy it directly into your block, tweak `targetBlockUid`, and adjust filters. `ctx.React` is not required here; everything is vanilla DOM.

- Accounts dashboard – `@nocobase/plugin-flow-engine/js-model/example/js-filter/accounts_filter_ant_style.md`
- Contacts board – `@nocobase/plugin-flow-engine/js-model/example/js-filter/contacts_filter_ant_style.md`
- Leads queue – `@nocobase/plugin-flow-engine/js-model/example/js-filter/leads_filter_ant_style.md`
- Opportunity pipeline – `@nocobase/plugin-flow-engine/js-model/example/js-filter/opportunities_filter_ant_style.md`
- Product catalog – `@nocobase/plugin-flow-engine/js-model/example/js-filter/product_categories_ant_style.md`
- Ticket triage – `@nocobase/plugin-flow-engine/js-model/example/js-filter/tickets_filter_ant_style.md`

## Usage checklist

1. Place the script inside the block that should host the toolbar. Pass `targetBlockUid` through `ctx.args` if you do not want to hard-code it.
2. Each chip definition includes a JSON filter. Update them to match your collections (`type`, `status`, `owner_id`, etc.).
3. The helper removes previous filter groups bound to `ctx.model.uid` to avoid duplicates and then refreshes the target block.
4. Reference each preset with its `@nocobase/plugin-flow-engine/...` path—runtime tools handle mapping to the physical storage directory.
