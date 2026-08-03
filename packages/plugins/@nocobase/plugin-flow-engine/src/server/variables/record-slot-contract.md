# Record Provider Slot 安全合同

## GO/NO-GO

**NO-GO。** 当前服务器不能只依靠 RD 指向的持久化 FlowModel 和服务器注册语义，为全部生产 RecordRef 编译
`canonical variable path -> exact Provider Slot`。Task 02–06 在引入可信 provenance 之前不得实施，也不得改用变量级
matcher、客户端自报 slot 或 generic strict-prefix fallback。

## 安全不变量

1. 公开 `variables:resolve` 的 single 与 batch 请求必须同时通过 canonical path allow-list 和 exact Provider
   Slot 授权。
2. Record descriptor 只能安装到服务器为该 canonical path 证明的 Provider 节点；“descriptor prefix 是使用路径的
   严格前缀”不是授权。
3. 服务器不能使用客户端提交的 slot、`collection`、`dataSourceKey`、`filterByTk`、`associationName` 或
   `sourceId` 推导 Provider Slot。
4. 未知变量、缺少可信 slot、歧义 slot 和缺少动态 provenance 的 strict binding 必须 fail closed。被拒绝的
   descriptor 不得进入 prefetch、cache、data source manager、repository、`find` 或 `findOne`。
5. `allowConfigure`/`root` 只可绕过 canonical path membership，不能制造或绕过 Record Slot 授权。
6. trusted/internal single 与 batch 保留现有 RecordRef 兼容；prototype/internal key 保护仍然生效。
7. `fields`/`appends` 不属于本轮 Provider Slot 安全边界，不参与 slot 推导、GO/NO-GO 或新增限制。

## 信任边界

- RD 只以当前会话信息混淆 FlowModel UID；它不携带 Provider provenance，也不是客户端 slot 声明的签名。
- 持久化 FlowModel 可证明模板中出现的 canonical path、模型类型、子模型和已保存 step params。
- 表单当前值、popup `inputArgs`、父 context 的 meta/resolver 和 Record descriptor 都是运行时输入，不能作为
  服务器拥有的 slot 证明。
- 客户端仍可改变 `collection`、`dataSourceKey`、`filterByTk`、`associationName`、`sourceId`；这些值不得进入
  slot 判定输入。是否继续允许这些值决定查询目标，是本任务已冻结的兼容合同，不在本文件扩展。

## Provider Slot 矩阵

表中的 slot 是相对变量根的 segment 数组。`*` 只描述 path 的剩余字段，不表示可授权任意 Provider prefix。

| 变量 path | 生产 descriptor slot | 服务器推导来源 | 结论 | 后续兼容测试 owner |
| --- | --- | --- | --- | --- |
| `record.*` | `[]` | direct-record 服务器固定语义 | 可唯一推导 | Task 05 |
| `responseRecord.*` | `[]` | afterSuccess direct-record 固定语义 | 可唯一推导 | Task 05 |
| `clickedRowRecord.*` | `[]` | TableBlock direct-record 固定语义 | 可唯一推导 | Task 05 |
| `view.record.*` | `["record"]` | `createViewMeta`/view RecordRef 固定结构 | 可唯一推导 | Task 05 |
| `view.sourceRecord.*` | 无已确认生成器 | 当前 checkout 未发现生产 RecordRef | 不授权 | 发布前插件扫描 |
| `popup.record.*` | `["record"]` | popup builder 固定结构 | 可唯一推导 | Task 05 |
| `popup.sourceRecord.*` | `["sourceRecord"]` | popup builder 固定结构 | 可唯一推导 | Task 05 |
| `popup.(parent.)+.record.*` | `["parent", ..., "record"]` | view stack 的 parent record builder | 可唯一推导 | Task 05 |
| `popup.(parent.)+.sourceRecord.*` | 当前 builder 不生成 | resolver/旧测试声称支持，但无生产 descriptor 证据 | 不授权；先修正生成器或删除宽泛声明 | Task 05 |
| 普通 Form 已配置 association `formValues.<association>.*` | `["<association>"]` 或瞬时回退为 `[]` | 配置字段可持久化，但当前值决定 builder 是否产出 association anchor | **歧义，阻断** | 新前置设计 |
| 普通 Form 未配置字段 `formValues.<field>...` | `[]` | 当前记录 root anchor | 配置状态可从持久化 Form 子树推导 | Task 05 |
| FilterForm `formValues.<fieldName>.*` | `fieldName` 的完整 segments | 持久化 item `props.name`，fallback 为 `fieldPath + uid` | 可唯一推导 | Task 05 |
| `item.value.<association>.*` | `["value", "<association>"]` | 当前 item collection/meta 与瞬时值 | slot 形态固定，但 Provider provenance 未持久化 | 新前置设计 |
| `item.(parentItem.)+.value.<association>.*` | `["parentItem", ..., "value", "<association>"]` | parent meta/resolver 来自父 context 或 popup `inputArgs` | **缺少可信 provenance，阻断** | 新前置设计 |

### 普通 Form 反例

同一持久化 Form、同一 canonical path `formValues.customer.level.name` 有三种运行时结果：

1. `customer` 包含目标主键且本地缺少 `level.name`：association builder 生成
   `formValues.customer -> RecordRef`，slot 为 `["customer"]`。
2. `customer` 为非空对象但暂时没有目标主键，且本地仍缺少 `level.name`：resolver 仍选择服务器，association
   builder 无法生成 descriptor；`FlowContext.resolveJsonTemplate()` 的通用 missing-top fallback 随后注入
   `formValues -> current record RecordRef`，slot 变为 `[]`。
3. 本地已有完整 `customer.level.name`：不发生服务器解析，也没有 Provider。

持久化的字段配置能区分“已配置/未配置”，但不能区分上述瞬时状态。若固定 `["customer"]` 会破坏当前根
fallback；若同时授权 `[]` 和 `["customer"]`，攻击者即可在同一 canonical path 的两个 slot 之间移动
Provider；若根据请求 descriptor 选择，则等价于信任客户端。

### FilterForm 推导规则

FilterForm 的每个字段 descriptor 挂载到完整运行时 field name。服务器可从持久化 item 的非空
`props.name` 读取该路径；旧模型可使用持久化 `fieldPath` 与 `uid` 复现客户端 fallback 名称。编译时按 analyzer
提供的 runtime segments 比较完整 field-name segments，只允许该 exact prefix。多段 field name 不能缩短到第一段。

### item / parentItem 反例

`item` 当前层可由当前 collection meta 产生 association resolver；父层 meta、resolver 和值还可在模型加载后由
父 context 或 `view.inputArgs` 注入。同一个持久化模型可在运行 A 中为
`item.parentItem.value.department.title` 生成
`item.parentItem.value.department -> RecordRef`，在运行 B 中因父 resolver/meta 不同而不生成 Provider。
RD 和持久化模型不包含这些函数或它们的可信来源绑定，服务器无法证明本次请求确实拥有该 Provider。

仅从 path 形态推导 `parentItem...value.<segment>` 会把所有同形 path 都视为可查询 slot，等价于用变量 family
规则代替当前 FlowModel 的 exact Provider provenance，不满足本任务合同。

## authorization 行为

- 普通角色：RD 有效、canonical path 在持久化 FlowModel 中、且 exact Provider Slot 有可信证明时才允许 binding。
- `allowConfigure`/`root`：可跳过 path membership；固定服务器 slot 仍可用，动态 `formValues`/`item` 没有可信
  provenance 时拒绝。
- 无 RD：仅纯模板或明确不依赖 FlowModel 的固定服务器变量按各自现有 validator 处理；动态 Record binding 拒绝。
- 未注册变量或插件变量：strict Record binding 默认拒绝，直到插件提供服务器拥有的 exact slot 编译语义。
- trusted/internal：不应用公开 strict slot gate，保持现有 single、batch、图表、外部数据源和 association repository
  调用兼容。

## 解除门禁的前置方案

后续只能选择并单独评审以下方案之一：

1. 持久化 Provider provenance：保存每个变量使用位置的 provider kind、exact slot 和必要的上下文来源；服务器从
   持久化记录编译合同。
2. 服务器签发短期 capability：绑定 session、RD、canonical path、exact slot 和有效期；公开 resolve 请求只消费
   经服务器签发且未过期的 capability。

另一种兼容性变化是先把客户端生成语义规范化为“同一 canonical path 永远只有一个 slot”，包括删除普通 Form
的 association-to-root fallback，并消除 `item.parentItem` 的瞬时 resolver 差异。该方案会改变现有运行时行为，必须
作为新的前置任务单独批准和验证，不能在 Task 02 中隐式实施。

## 发布门禁

- 当前 checkout 的核心与插件扫描不能代表未 checkout 的商业/第三方插件。启用 strict 默认拒绝前，必须扫描全部
  发布插件的 `resolveOnServer`、`serverOnlyWhenContextParams` 和 `buildVariablesParams`。
- `popup.parent.sourceRecord` 与任何 `view.sourceRecord` 只有出现真实生产 builder 证据后才能进入授权矩阵。
- 独立 security reviewer 必须用普通 Form 瞬时值反例和 `item.parentItem` transient-parent 反例复核前置方案；在其
  给出 GO 之前，分支保持 NO-GO。
