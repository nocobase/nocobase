# RunJS 插件扩展点（ctx 文档 / snippets / 场景映射）

当插件新增或扩展 RunJS 能力时，建议通过 **官方扩展点**把“上下文映射 / `ctx` 文档 / 示例代码”一并注册进去，让：

- CodeEditor 能自动补全 `ctx.xxx.yyy`
- AI coding 能获得结构化的 `ctx` API reference + 示例

本章介绍两个扩展点：

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

用于注册 RunJS 的“贡献”（contribution），典型用途：

- 新增/覆盖 `RunJSContextRegistry` 映射（modelClass -> RunJSContext，含 `scenes`）
- 为 `FlowRunJSContext` 或自定义 RunJSContext 扩展 `RunJSDocMeta`（`ctx` API 的说明/示例/补全模板）

### 行为说明

- contribution 会在 `setupRunJSContexts()` 阶段统一执行；
- 如果 `setupRunJSContexts()` 已完成，**晚注册会立即执行一次**（无需重跑 setup）；
- 每个 contribution 对每个 `RunJSVersion` **最多只会执行一次**。

### 示例：新增一个可编写 JS 的模型上下文

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx 文档/补全（RunJSDocMeta）
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

  // 2) model -> context 映射（scene 影响编辑器补全/snippets 筛选）
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

用于注册 RunJS 的示例代码片段（snippets），用于：

- CodeEditor snippet 补全
- 作为 AI coding 的示例/参考素材（按场景/版本/locale 可裁剪）

### 推荐 ref 命名

建议使用：`plugin/<pluginName>/<topic>`，例如：

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

避免与 core 的 `global/*`、`scene/*` 冲突。

### 冲突策略

- 默认不覆盖已有 `ref`（返回 `false`，但不抛错）
- 需要覆盖时显式传入 `{ override: true }`

### 示例：注册一个 snippet

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

## 3. 最佳实践

- **文档 + snippets 分层维护**：
  - `RunJSDocMeta`：描述/补全模板（短、结构化）
  - snippets：长示例（可复用、可按 scene/version 筛选）
- **避免 prompt 过长**：示例不宜过多，优先收敛到“最小可运行模板”。
- **场景优先级**：若你的 JS 代码主要运行在表单/表格等场景，请尽量填对 `scenes`，提升补全与示例相关性。

## 4. 基于实际 ctx 隐藏补全：`hidden(ctx)`

某些 `ctx` API 具有强场景性（例如 `ctx.popup` 仅在弹窗/抽屉打开时可用）。当你希望在补全时隐藏这些不可用 API，可以在 `RunJSDocMeta` 中为对应条目定义 `hidden(ctx)`：

- 返回 `true`：隐藏当前节点及其子树
- 返回 `string[]`：隐藏当前节点下的指定子路径（支持一次返回多个路径；路径为相对路径；按前缀匹配隐藏子树）

`hidden(ctx)` 支持 async：你可以直接 `await ctx.xxx` 来判断（由使用者自行决断）。建议尽量快速、无副作用（不要发网络请求）。

示例：仅当存在 `popup.uid` 时展示 `ctx.popup.*` 补全

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.popup)?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

示例：popup 可用但隐藏部分子路径（仅相对路径；例如隐藏 `record` 与 `parent.record`）

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.popup;
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

说明：CodeEditor 始终启用基于实际 `ctx` 的补全过滤（fail-open，不抛错）。
