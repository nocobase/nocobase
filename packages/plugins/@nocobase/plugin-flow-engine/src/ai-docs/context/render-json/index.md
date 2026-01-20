# ctx.resolveJsonTemplate()

`ctx.resolveJsonTemplate(template)` walks a JSON value and resolves every `{{expression}}` placeholder against the FlowContext (including async properties). It supports primitives, objects, arrays, and nested structures.

## Behavior

- Recursively resolves strings containing `{{path}}`.
- Awaits async context properties so templates can reference deferred values.
- Works with any JSON-ish input (`string | object | array`).

## Examples

- `@nocobase/plugin-flow-engine/src/ai-docs/context/render-json/full.ts` resolves nested objects/arrays against synchronous context properties.
- `@nocobase/plugin-flow-engine/src/ai-docs/context/render-json/async.ts` highlights how async getters are awaited automatically before being injected into the template.
