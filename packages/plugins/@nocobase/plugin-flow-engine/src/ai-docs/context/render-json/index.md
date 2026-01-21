# ctx.resolveJsonTemplate()

`ctx.resolveJsonTemplate(template)` walks a JSON value and resolves every `{{expression}}` placeholder against the FlowContext (including async properties). It supports primitives, objects, arrays, and nested structures.

## Behavior

- Recursively resolves strings containing `{{path}}`.
- Awaits async context properties so templates can reference deferred values.
- Works with any JSON-ish input (`string | object | array`).
