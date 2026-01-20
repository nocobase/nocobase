# ctx.defineMethod()

`ctx.defineMethod(name, fn)` registers an ad-hoc helper on the current FlowContext. Subsequent callers can access the function through `ctx.methods[name]` (or by destructuring `ctx`).

## Usage Patterns

- **Register helpers** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-method/basic.ts` → `registerMethod`) binds an `add(a, b)` function to the context.
- **Invoke helpers** (`@nocobase/plugin-flow-engine/src/ai-docs/context/define-method/basic.ts` → `callDefinedMethod`) fetches `ctx.methods.add` and executes it with runtime values.

Methods automatically bind to the current context, so `this` and `ctx` references inside the handler are safe. Use this mechanism to expose computed utilities to templates, child views, or downstream delegates.
