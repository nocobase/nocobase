## Context

- 变量层面的 metaTree 目前由 `FlowContext.getPropertyMetaTree()` 提供（可返回异步 children 以支持懒加载）。
- RunJS 方法/属性的描述与签名目前由 `RunJSDocMeta` 提供（通过 `FlowRunJSContext.define(...)` 声明，并由 `getRunJSDocFor()` 按 `modelClass + version + locale` 取用；签名主要体现在 `detail` 字段）。
- 上层消费侧（例如 CodeEditor 补全、AI coding 上下文提示）需要将两者组合，同时需要可控的“限深”能力来避免 `record` 等多层关联字段导致输出膨胀。

## Goals / Non-Goals

- Goals
  - 增加一个统一入口 `ctx.getMeta()`，一次性返回 “变量 metaTree + RunJS 文档 meta”。
  - 支持通过 `maxDepth` 指定 metaTree 返回的最高层级，避免深层关系字段无限展开。
  - 保持惰性：在 `maxDepth` 限制下，不应因为裁剪而触发额外的异步 meta 解析/网络请求。

- Non-Goals
  - 不在本变更中改变现有 `RunJSDocMeta` 的结构（仍以 `description/detail/examples/completion/hidden` 为主）。
  - 不在本变更中强制迁移所有调用点到 `ctx.getMeta()`（允许渐进式迁移）。

## Decisions

- Decision: `getMeta` 返回结构采用 `{ metaTree, doc }`
  - `metaTree`：复用 `getPropertyMetaTree` 的返回类型 `MetaTreeNode[]`，保证已有 UI 组件可直接复用。
  - `doc`：直接返回 `RunJSDocMeta`（方法签名继续使用 `detail` 字段），避免重复定义/转换。

- Decision: `maxDepth` 仅约束 metaTree 的展开深度
  - 深度语义：以返回的根节点为 depth=1；当 `depth >= maxDepth` 时，节点不再暴露 `children`（或将 `children` 置空）。
  - 对异步 children：通过包装 `children()` 的返回值，在 resolve 后对结果继续裁剪（递归），而不是提前 resolve。

- Decision: API 版本/locale 的透传策略
  - `version` 通过 options 传入（默认 `'v1'`），复用现有 `RunJSContextRegistry` 映射与 `getLocale(ctx)` 逻辑。
  - `locale` 不作为 `getMeta` 的显式参数，优先从当前 ctx 上推导（与 `getRunJSDocFor` 保持一致）。

## Risks / Trade-offs

- `maxDepth` 裁剪如果实现不当，可能会导致：
  - 触发不必要的 async children 解析（影响性能、甚至造成副作用）；
  - 破坏现有组件对 `children` 为函数的懒加载假设（需要保持返回类型不变）。

## Migration Plan

- 新增方法为增量能力：旧代码可继续使用 `getPropertyMetaTree()` + `getRunJSDocFor()`。
- CodeEditor/AI coding 等消费方可渐进迁移：优先调用 `ctx.getMeta?.()`，不存在则回退到原有逻辑。

## Open Questions

- `maxDepth` 的默认值是否应该有限（例如 2~3）以避免“无配置时输出过大”？还是保持 Infinity 以与 `getPropertyMetaTree()` 语义一致？
- 是否需要在 `getMeta` 内部应用 `RunJSDocMeta.hidden(ctx)` 的过滤逻辑，还是继续由消费方自行处理？

