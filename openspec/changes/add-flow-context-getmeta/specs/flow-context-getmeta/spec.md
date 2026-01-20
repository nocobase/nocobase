## ADDED Requirements

### Requirement: `FlowContext.getMeta()` 返回变量 metaTree 与 RunJS 文档 meta

系统 SHALL 提供 `FlowContext.getMeta(value?, options?)` 方法，用于一次性获取：

- `metaTree`：当前 `ctx` 的变量元信息树（与 `getPropertyMetaTree` 语义一致，可用于变量选择/补全）
- `doc`：当前 `ctx` 的 RunJS 文档元信息（`RunJSDocMeta`，包含方法描述与签名）

#### Scenario: 默认调用返回完整根级 metaTree 与 doc
- **GIVEN** 一个已初始化的 `FlowContext` 实例 `ctx`
- **WHEN** 调用 `ctx.getMeta()`
- **THEN** 返回结果 SHALL 包含 `metaTree`（等价于 `ctx.getPropertyMetaTree()` 的根级结果）
- **AND** 返回结果 SHALL 包含 `doc`（等价于 `getRunJSDocFor(ctx)` 的结果）

#### Scenario: 指定 value 时返回对应子树
- **GIVEN** `ctx` 存在变量 `record` 且其 meta 可生成子节点
- **WHEN** 调用 `ctx.getMeta('{{ ctx.record }}')`
- **THEN** 返回结果中的 `metaTree` SHALL 表示 `record` 的子树（与 `ctx.getPropertyMetaTree('{{ ctx.record }}')` 语义一致）

### Requirement: `maxDepth` 限制 metaTree 返回的最高层级且保持惰性

系统 SHALL 支持通过 `getMeta(..., { maxDepth })` 限制 `metaTree` 的返回层级，并保持 `children` 的惰性（不应因为限深而额外触发异步 meta 解析）。

#### Scenario: maxDepth=1 仅返回根级节点
- **GIVEN** `ctx.getPropertyMetaTree()` 返回的根级节点可能包含可展开的 `children`
- **WHEN** 调用 `ctx.getMeta(undefined, { maxDepth: 1 })`
- **THEN** 返回的 `metaTree` SHALL 仅包含根级节点信息
- **AND** 根级节点 SHALL 不再向下暴露可展开的 `children`

#### Scenario: maxDepth=2 返回一层子节点但不继续展开
- **GIVEN** `ctx` 的某个根节点 `record` 存在可展开的子节点
- **WHEN** 调用 `ctx.getMeta('{{ ctx.record }}', { maxDepth: 2 })`
- **THEN** 返回的 `metaTree` SHALL 包含 `record` 下的一层字段节点
- **AND** 这些字段节点 SHALL 不再向下暴露可展开的 `children`

