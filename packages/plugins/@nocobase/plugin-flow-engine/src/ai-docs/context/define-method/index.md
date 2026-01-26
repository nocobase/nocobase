# ctx.defineMethod()

`ctx.defineMethod(name, fn)` registers an ad-hoc helper on the current FlowContext. Subsequent callers can access the function through `ctx.methods[name]` (or by destructuring `ctx`).

## Usage Patterns

Methods automatically bind to the current context, so `this` and `ctx` references inside the handler are safe. Use this mechanism to expose computed utilities to templates, child views, or downstream delegates.
