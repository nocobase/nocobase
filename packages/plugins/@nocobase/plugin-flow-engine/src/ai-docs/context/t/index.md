# ctx.t()

`ctx.t(key, options?)` translates strings using the flow runtime’s i18next instance. It is available on every FlowContext (engine, model, runtime) so you can localize labels anywhere.

## Usage Patterns

The returned function is already bound to the current locale, so you just pass the translation key plus optional `{ ns, ...variables }`.
