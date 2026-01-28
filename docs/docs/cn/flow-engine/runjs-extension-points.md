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

`hidden(ctx)` 支持 async：你可以使用 `await ctx.getVar('ctx.xxx')` 来判断（由使用者自行决断）。建议尽量快速、无副作用（不要发网络请求）。

示例：仅当存在 `popup.uid` 时展示 `ctx.popup.*` 补全

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

示例：popup 可用但隐藏部分子路径（仅相对路径；例如隐藏 `record` 与 `parent.record`）

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

说明：CodeEditor 始终启用基于实际 `ctx` 的补全过滤（fail-open，不抛错）。

## 5. 运行时 `info/meta` 与上下文信息 API（面向补全与大模型）

除了通过 `FlowRunJSContext.define()`（静态）维护 `ctx` 文档外，你也可以在运行时通过 `FlowContext.defineProperty/defineMethod` 注入 **info/meta**，并通过以下 API 输出**可序列化**的上下文信息，供 CodeEditor/大模型使用：

- `await ctx.getApiInfos(options?)`：静态 API 信息
- `await ctx.getVarInfos(options?)`：变量结构信息（来源 `meta`，支持 path/maxDepth 展开）
- `await ctx.getEnvInfos()`：运行时环境快照

### 5.1 `defineMethod(name, fn, info?)`

`info` 支持（均可选）：

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns`（JSDoc-like）

> 注意：`getApiInfos()` 输出为静态 API 文档，不会包含 `deprecated` / `disabled` / `disabledReason` 等字段。

示例：为 `ctx.refreshTargets()` 提供文档链接

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: '刷新目标区块的数据',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`：用于变量选择器 UI（`getPropertyMetaTree` / `FlowContextSelector`），决定是否展示、树结构、禁用等（支持函数/async）。
  - 常用字段：`title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`：用于静态 API 文档（`getApiInfos`）与面向大模型的描述，不影响变量选择器 UI（支持函数/async）。
  - 常用字段：`title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

当仅提供 `meta`（未提供 `info`）时：

- `getApiInfos()` 不会返回该 key（因为静态 API 文档不从 `meta` 推断）
- `getVarInfos()` 会基于 `meta` 构建变量结构（用于变量选择器/动态变量树）

### 5.3 上下文信息 API

用于输出“可用的上下文能力信息”，返回形态为方案 A（不再包 `{ apis/envs/... }` 一层）。

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // 可直接用于 await ctx.getVar(getVar)，推荐以 "ctx." 开头
  value?: any; // 已解析的静态值（可序列化，仅在能推断到时返回）
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // 静态文档（顶层一层）
type FlowContextVarInfos = Record<string, any>; // 变量结构（可按 path/maxDepth 展开）
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

常用参数：

- `getApiInfos({ version })`：RunJS 文档版本（默认 `v1`）
- `getVarInfos({ path, maxDepth })`：剪裁与最大展开层级（默认 3）

注意：以上 API 的返回结果都不包含函数，适合直接序列化传给大模型。

### 5.4 `await ctx.getVar(path)`

当你只有一个“变量路径字符串”（例如来自配置/用户输入），希望直接拿到该变量的运行时值时，可以使用 `getVar`：

- 示例：`const v = await ctx.getVar('ctx.record.roles.id')`
- `path` 为以 `ctx.` 开头的表达式路径（例如 `ctx.record.id` / `ctx.record.roles[0].id`）

另外：以下划线 `_` 开头的方法/属性会被视为私有成员，不会出现在 `getApiInfos()` / `getVarInfos()` 的输出中。
