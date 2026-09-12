---
title: RunJS Plugin Extension Points (ctx Documentation / Snippets / Scene Mapping)
---

# RunJS Plugin Extension Points (ctx Documentation / Snippets / Scene Mapping)

When a plugin adds or extends RunJS capabilities, it is recommended to register the "context mapping / `ctx` documentation / example code" through **official extension points**. This ensures:

- CodeEditor can provide auto-completion for `ctx.xxx.yyy`.
- AI coding can obtain structured `ctx` API references and examples.

This chapter introduces two extension points:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Used to register RunJS "contributions." Typical use cases include:

- Adding/overriding `RunJSContextRegistry` mappings (`modelClass` -> `RunJSContext`, including `scenes`).
- Extending `RunJSDocMeta` (descriptions/examples/completion templates for the `ctx` API) for `FlowRunJSContext` or custom `RunJSContext`.

### Behavior Description

- Contributions are executed collectively during the `setupRunJSContexts()` phase.
- If `setupRunJSContexts()` has already completed, **late registrations will be executed immediately** (no need to re-run setup).
- Each contribution will be executed **at most once** for each `RunJSVersion`.

### Example: Adding a JS-writable Model Context

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx documentation/completion (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) model -> context mapping (scene affects editor completion/snippet filtering)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Used to register example code snippets for RunJS, which are used for:

- CodeEditor snippet completion.
- Serving as examples/reference materials for AI coding (can be filtered by scene/version/locale).

### Recommended ref Naming

It is suggested to use: `plugin/<pluginName>/<topic>`, for example:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Avoid conflicts with core `global/*` or `scene/*` namespaces.

### Conflict Strategy

- By default, existing `ref` entries are not overwritten (returns `false` without throwing an error).
- To explicitly overwrite, pass `{ override: true }`.

### Example: Registering a Snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Best Practices

- **Layered Maintenance of Documentation + Snippets**:
  - `RunJSDocMeta`: Descriptions/completion templates (short, structured).
  - Snippets: Long examples (reusable, filterable by scene/version).
- **Avoid Excessive Prompt Length**: Examples should be concise; prioritize "minimal runnable templates."
- **Scene Priority**: If your JS code primarily runs in scenarios like forms or tables, ensure the `scenes` field is filled correctly to improve the relevance of completions and examples.

## 4. Hiding Completions Based on Actual ctx: `hidden(ctx)`

Certain `ctx` APIs are highly context-specific (e.g., `ctx.popup` is only available when a popup or drawer is open). If you want to hide these unavailable APIs during completion, you can define `hidden(ctx)` for the corresponding entry in `RunJSDocMeta`:

- Returns `true`: Hides the current node and its subtree.
- Returns `string[]`: Hides specific sub-paths under the current node (supports returning multiple paths; paths are relative; subtrees are hidden based on prefix matching).

`hidden(ctx)` supports `async`: You can use `await ctx.getVar('ctx.xxx')` to determine visibility (at the user's discretion). It is recommended to keep this logic fast and side-effect-free (e.g., avoid network requests).

Example: Show `ctx.popup.*` completions only when `popup.uid` exists.

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

Example: Popup is available but some sub-paths are hidden (relative paths only; e.g., hiding `record` and `parent.record`).

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

Note: CodeEditor always enables completion filtering based on the actual `ctx` (fail-open, does not throw errors).

## 5. Runtime `info/meta` and Context Information API (for Completions and LLMs)

In addition to maintaining `ctx` documentation statically via `FlowRunJSContext.define()`, you can also inject **info/meta** at runtime via `FlowContext.defineProperty/defineMethod`. You can then output **serializable** context information for CodeEditor or LLMs using the following APIs:

- `await ctx.getApiInfos(options?)`: Static API information.
- `await ctx.getVarInfos(options?)`: Variable structure information (sourced from `meta`, supports path/maxDepth expansion).
- `await ctx.getEnvInfos()`: Runtime environment snapshot.

### 5.1 `defineMethod(name, fn, info?)`

`info` supports (all optional):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc-like)

> Note: `getApiInfos()` outputs static API documentation and will not include fields like `deprecated`, `disabled`, or `disabledReason`.

Example: Providing documentation links for `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Refresh data of the target blocks',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Used for the variable selector UI (`getPropertyMetaTree` / `FlowContextSelector`). It determines visibility, tree structure, disabling, etc. (supports functions/async).
  - Common fields: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Used for static API documentation (`getApiInfos`) and descriptions for LLMs. It does not affect the variable selector UI (supports functions/async).
  - Common fields: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

When only `meta` is provided (without `info`):

- `getApiInfos()` will not return this key (as static API docs are not inferred from `meta`).
- `getVarInfos()` will build the variable structure based on `meta` (used for variable selectors/dynamic variable trees).

### 5.3 Context Information API

Used to output "available context capability information."

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Can be used directly in await ctx.getVar(getVar), recommended to start with "ctx."
  value?: any; // Resolved static value (serializable, returned only when inferable)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Static documentation (top-level)
type FlowContextVarInfos = Record<string, any>; // Variable structure (expandable by path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Common parameters:

- `getApiInfos({ version })`: RunJS documentation version (defaults to `v1`).
- `getVarInfos({ path, maxDepth })`: Trimming and maximum expansion depth (defaults to 3).

Note: The results returned by the above APIs do not contain functions and are suitable for direct serialization to LLMs.

### 5.4 `await ctx.getVar(path)`

When you have a "variable path string" (e.g., from configuration or user input) and want to retrieve the runtime value of that variable directly, use `getVar`:

- Example: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` is an expression path starting with `ctx.` (e.g., `ctx.record.id` / `ctx.record.roles[0].id`).

Additionally: Methods or properties starting with an underscore `_` are treated as private members and will not appear in the output of `getApiInfos()` or `getVarInfos()`.