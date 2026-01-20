# ctx.t()

`ctx.t(key, options?)` translates strings using the flow runtime’s i18next instance. It is available on every FlowContext (engine, model, runtime) so you can localize labels anywhere.

## Usage Patterns

- **Inside models** (`@nocobase/plugin-flow-engine/src/ai-docs/context/t/examples.ts` → `translateInModel`): render localized strings with namespaces and interpolation.
- **Inside steps** (`@nocobase/plugin-flow-engine/src/ai-docs/context/t/examples.ts` → `translateInStep`): translate during handler execution to produce messages or logs.
- **Plugins / utilities** (`@nocobase/plugin-flow-engine/src/ai-docs/context/t/examples.ts` → `translateInPlugin`): reuse the same `t` helper when you only have the application context.

The returned function is already bound to the current locale, so you just pass the translation key plus optional `{ ns, ...variables }`.
