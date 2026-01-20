# Change: 增加 `FlowContext.getMeta()`，统一获取 RunJS 运行时元信息

## Why

当前在 RunJS 相关场景（CodeEditor 补全、AI coding 提示、变量选择器等）要获取运行时“可用上下文信息”时，需要拼装多个来源：

- `ctx.getPropertyMetaTree()`：提供 `ctx.xxx` 变量的 metaTree（尤其是 `record` / `formValues` / `popup` 等动态字段树）
- `RunJSDocMeta`（通过 `getRunJSDocFor()`）：提供 `ctx` 方法/属性的文档、示例，以及方法签名（`detail`）

这带来一些问题：

- 业务侧重复实现“合并 / 裁剪 / 限深”的逻辑，并且难以统一性能策略；
- 当 `ctx.record` 等对象存在多层关联字段时（关系字段继续展开），上层无法指定返回的最高层级，容易生成过大的 meta（影响补全性能 / AI prompt 长度）。

## What Changes

- 在 `packages/core/flow-engine/src/flowContext.ts` 为 `FlowContext` 增加方法 `getMeta`：
  - 变量 meta：复用现有 `getPropertyMetaTree()`，并支持通过 `maxDepth` 限制返回的层级；
  - 文档 meta：复用现有 RunJS 文档体系（`RunJSContextRegistry` + `FlowRunJSContext.define`），返回 `RunJSDocMeta`；其中方法的 `description` 与 `detail` 即为描述与签名。
- 为 `getMeta` 定义明确的返回结构与 options（见下方草案）。
- （可选但推荐）将 `packages/core/client/src/flow/components/code-editor/runjsCompletions.ts` 等调用点迁移为优先使用 `ctx.getMeta()`，减少重复逻辑。

### API 草案

```ts
export type FlowContextGetMetaOptions = {
  version?: RunJSVersion; // 默认 'v1'
  maxDepth?: number; // 默认 Infinity；控制 metaTree 的返回层级
  flatten?: boolean; // 透传给 getPropertyMetaTree 的语义
};

export type FlowContextMeta = {
  metaTree: MetaTreeNode[]; // 变量树（可含 async children）
  doc: RunJSDocMeta; // RunJS 文档（含 methods.*.detail 签名）
};

// 与 getPropertyMetaTree 保持调用习惯一致：value 仍使用 "{{ ctx.xxx }}" 格式
getMeta(value?: string, options?: FlowContextGetMetaOptions): FlowContextMeta;
```

### maxDepth 语义（示例）

- `ctx.getMeta(undefined, { maxDepth: 1 })`：仅返回根级变量节点（不再向下展开 children）
- `ctx.getMeta('{{ ctx.record }}', { maxDepth: 2 })`：返回 record 下的一层字段（包含关系字段节点，但不返回关系字段的子字段）

## Impact

- 影响代码：
  - `packages/core/flow-engine`：新增 `FlowContext.getMeta` 与相关类型/工具函数
  - `packages/core/client`：RunJS CodeEditor 补全、AI coding 等可逐步改用该统一入口（非强制）
- 兼容性：
  - 新增 API，默认不改变现有 `getPropertyMetaTree` / `getRunJSDocFor` 行为
- 风险点：
  - depth 裁剪需要正确处理异步 children（不能因为限深而触发额外的 meta 解析/网络请求）
  - 与 `FlowResource.getMeta()` 同名但语义不同，需要在文档中明确避免混淆

