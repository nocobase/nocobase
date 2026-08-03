# Record Provider Slot 安全合同

## GO/NO-GO

**GO。** 服务器可以按 RD 对应持久化 FlowModel 中的每条 canonical variable path，编译唯一的 exact Provider
Slot。普通 Form 的运行时歧义已通过固定客户端生成语义消除；`item` slot 还必须由持久化 owner 与服务器
collection metadata 证明对应字段为 association。

Task 02–06 可以继续，但不得退回变量级 matcher、客户端自报 slot 或 generic strict-prefix fallback。

## 安全不变量

1. 公开 `variables:resolve` 的 single 与 batch 请求必须同时通过 canonical path allow-list 和 exact Provider
   Slot 授权。
2. Record descriptor 只能安装到服务器为该 canonical path 编译的 Provider 节点；严格前缀本身不是授权。
3. 编译输入只来自持久化 FlowModel、analyzer 的结构化 path 和服务器固定变量语义；不得使用客户端提交的
   slot、`collection`、`dataSourceKey`、`filterByTk`、`associationName` 或 `sourceId`。
4. 未知变量、缺少 policy、歧义 slot 或 path 形状不匹配时 fail closed。被拒绝的 descriptor 不得进入
   prefetch、cache、data source manager、repository、`find` 或 `findOne`。
5. `allowConfigure`/`root` 只绕过 canonical path membership，不能制造或绕过 Record Slot 授权。
6. trusted/internal single 与 batch 保留现有 RecordRef 行为；prototype/internal key 保护仍然生效。
7. `fields`/`appends` 不属于本轮 Provider Slot 安全边界，不参与 slot 编译或新增限制。

## Provider Slot 矩阵

slot 是相对变量根的 exact segment 数组。表中的 `*` 只描述 canonical path 形状，不是授权 wildcard。

| canonical path | exact slot | 服务器推导来源 | 兼容 owner |
| --- | --- | --- | --- |
| `record.*`、`responseRecord.*`、`clickedRowRecord.*` | `[]` | direct-record 固定语义 | Task 05 |
| `view.record.*` | `["record"]` | view 固定语义 | Task 05 |
| `view.sourceRecord.*` | 不授权 | 当前 checkout 无生产生成器 | 发布门禁 |
| `popup.(parent.)*.(record\|sourceRecord).*` | 到 `record`/`sourceRecord` 为止的完整 segments | popup 固定结构 | Task 05 |
| 普通 Form 已配置 association `formValues.<association>.<descendant>` | `["<association>"]` | 持久化 Form host、grid fieldPath 与 collection association metadata | Task 05 |
| EditForm/PopupSubTableForm 未配置字段 `formValues.<field>...` | `[]` | 持久化 Form host 与 grid fieldPath | Task 05 |
| FilterForm `formValues.<fieldName>.<descendant>` | `fieldName` 的完整 segments | 持久化 item `props.name`，或 `fieldPath + uid` fallback | Task 05 |
| `item.(parentItem.)*.value.<association>.<descendant>` | 到 association 为止的完整 segments | 持久化 item owner、owner fieldPath 与 collection association metadata | Task 05 |

whole-record path 使用同一 exact slot。`item.index`、`item.length`、`item.value`、
`item.value.<association>` 以及不符合上述形状的 path 不产生 slot policy。

`popup.parent.sourceRecord` 的 resolver 与 builder 均覆盖完整 parent chain，并由 Task 05 行为测试冻结。
`view.sourceRecord` 没有相同生产证据，不授权。

## 普通 Form 唯一化规则

普通 Form 只把持久化 grid 中已配置字段的值交给 association builder：

- 已配置 association 深层 path：本地已有完整值时不查询；缺值且当前 association 有完整 target identity 时，只能
  在 `formValues.<association>` 生成 descriptor；清空、临时对象、缺主键或不完整 composite key 时不生成
  descriptor，也不得回退根 anchor。
- 未配置字段：即使瞬时 form state 偶然含 association identity，也不生成 association descriptor；编辑记录存在
  root identity 时，只能使用根 `formValues` anchor。
- 新建记录没有 root identity 时不生成 descriptor。

因此同一持久化 Form、同一 canonical path 不再在 `[]` 与 `["<association>"]` 之间切换。客户端瞬时值只影响
是否生成 descriptor，不影响合法 slot。

## FilterForm 与 item 编译规则

FilterForm 从 path 所属的持久化 item 读取非空 `props.name`；旧模型使用持久化 `fieldPath` 与 `uid` 复现客户端
fallback。只有该 item 对应 association field 且 canonical runtime segments 以完整 field-name segments 开头、
后面仍有 descendant 时，才编译该 exact slot；多段 field name 不得缩短。

item 按每条 canonical path 逐条编译：去掉零个或多个 `parentItem` 后，必须严格匹配
`value -> association -> descendant`。item 深度只由真实建立新 item 的持久化边界增加：`SubFormFieldModel`、
`SubFormListFieldModel` 本身，`PopupSubTableFormModel` 与其外层 `PopupSubTableFieldModel`，以及
`SubTableColumnModel` 与其外层 `SubTableFieldModel`。association field owner 本身不增加深度；
`RecordPickerFieldModel`、`PopupSubTableFieldModel`、`SubTableFieldModel`、`SubFormListFieldModel` 的直接子级若为
`subKey=grid-block` 的持久化 `BlockGridModel`，则先增加一个禁用 value 的 picker 边界；`SubFormListFieldModel`
随后仍增加自身的正常 item 边界。
field metadata 优先取 owner 自身，否则只取通过 `parentId` 或 `subModels.field.uid` 验证的直接 wrapper。
服务器从该 metadata 的 source collection 沿其 fieldPath 到达 item collection，再确认 path 中的字段确为 association；
最外层 `parentItem` root 则使用最外层 owner 的 source collection。owner、collection、field 缺失，或 scalar/JSON
字段伪装成 association 时均不产生 policy。所有被 path 跨过的 item owner 都必须由服务器 metadata 证明为
association；无效 owner 保留其深度并使该 path fail closed，不得通过忽略边界把 descriptor 移到外层 slot。
合法 slot 为 `parentItem* -> value -> association`；parent meta/resolver
和本地值只决定本次是否生成 descriptor，不改变 slot。

## authorization 行为

- 普通角色：RD 有效、canonical path 在持久化 FlowModel 中、且 descriptor prefix 与该 path 的 exact slot 完全
  相等时允许 binding。
- `allowConfigure`/`root`：可跳过 path membership；有有效 RD 时复用同一编译合同；无 RD 时仅固定服务器语义可
  编译 slot，`formValues` 等需要持久化 host 的变量 fail closed。
- 未注册变量或插件变量：strict Record binding 默认拒绝，直到插件提供服务器拥有的 exact-slot 编译语义。
- trusted/internal：不应用公开 strict slot gate。
- 同一 canonical key 若从持久化模型的不同 occurrence 编译出不同 slot，整条 key 视为歧义并不产生 policy。

## 发布门禁

- Task 05 已补齐并冻结 `popup.parent.sourceRecord` builder；Task 06 必须验证 resolver 与生产 descriptor 一致。
- 启用 strict 默认拒绝前，扫描全部发布商业/第三方插件的 `resolveOnServer`、
  `serverOnlyWhenContextParams` 和 `buildVariablesParams`；未知插件变量默认拒绝。
- Task 06 重放 `view.record.department`、`popup.record.roles` 与 `formValues` root/association 移动攻击，所有数据库
  入口调用计数必须为 0。
- 独立 reviewer 的首轮集成复核发现 item scalar/JSON 形状伪装；Task 06 修复后必须重放攻击并重新复核。最终
  分支仍须等待 tests、SQLite/Postgres/frontend CI 与集成复核。
