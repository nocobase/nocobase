# JSFieldModel

用于以 JavaScript 自定义字段的只读展示。典型用于：
- 表格列中的字段只读渲染（搭配 TableBlock）。
- 详情页的字段只读渲染（搭配 DetailsBlock）。

支持在“JavaScript settings”中编写并运行脚本，脚本通过 `ctx` 上下文读写容器、读取当前字段值与记录，并可结合视图能力（drawer/dialog）实现交互扩展。

## JSFieldModel 可用上下文（常用）
- `ctx.element`：ElementProxy（安全封装的 DOM 容器）。常用 `innerHTML` 写入内容，或 `addEventListener` 绑定事件。
- `ctx.value`：当前字段值（只读形态）。
- `ctx.record`：当前记录数据对象（在表格/详情中可用）。
- `ctx.collection`：当前集合对象，可获取字段定义、主键等元信息。
- `ctx.viewer`：视图控制器，支持 `drawer`、`dialog`、`popover`、`embed` 等能力。
- `ctx.api`：API 客户端，可发起请求（如读取/更新数据）。
- `ctx.t`：国际化函数，用于界面文案翻译。

说明：
- JSFieldModel 在运行时会为容器注册 `ctx.element`，并在只读场景下提供 `ctx.value`；所在区块为集合块时会透传 `ctx.collection`、`ctx.record` 等。
- 所有 DOM 操作务必在 `ctx.element` 内进行，避免直接访问 `document` 带来的 XSS 风险。

## 常见场景
- 详情页：格式化金额/时间、拼接多个字段展示、生成只读的富文本展示。
- 表格列：根据值动态着色、组合多个字段生成标签、显示状态图标和说明。

## 示例：详情页字段格式化（金额 + 折扣）
<code src="./demos/details.tsx"></code>

## 示例：表格列只读渲染（状态徽标）
<code src="./demos/table.tsx"></code>

## 进阶提示
- 可通过 `ctx.openView` 打开抽屉查看扩展信息；
- 如需跨字段取值，可用 `ctx.record` 拼接显示；
- 需要在表单中“可编辑”的 JS 字段，请使用 JSEditableFieldModel。

# JSEditableFieldModel

用于在表单项中以 JavaScript 自定义“可编辑字段”的输入体验。典型用于：
- 自定义输入控件（原生 input/select、第三方库封装等）；
- 通过 API 动态加载可选项、联动刷新；
- 复杂的校验、格式化与与表单的双向同步。

可在“JavaScript settings”中编写脚本，运行时通过 `ctx` 上下文读写容器与表单值。

## JSEditableFieldModel 可用上下文（常用）
- `ctx.element`：ElementProxy（容器），脚本内用它读写 DOM。
- `ctx.getValue()` / `ctx.setValue(v)`：获取/设置当前字段值（与表单双向绑定）。
- `ctx.namePath`：当前字段的 `namePath`。
- `ctx.disabled`、`ctx.readOnly`：禁用/只读状态。
- `ctx.form`：AntD Form 实例，可读写其它字段或做校验。
- `ctx.api`：API 客户端，可发起 HTTP 请求（可搭配 Mock 使用）。
- `ctx.viewer`：视图控制器（drawer/dialog/popover/embed）。

说明：
- 所有 DOM 操作需在 `ctx.element` 下进行，避免直接访问 `document` 导致 XSS 风险；
- 需要只读展示时请使用 `JSFieldModel`。

## 示例：通过 API 加载下拉可选项
<code src="./demos/remote-select.tsx"></code>

## 示例：远程搜索（防抖 + 实时建议）
<code src="./demos/remote-search.tsx"></code>

## 示例：远程搜索（虚拟滚动列表）
<code src="./demos/remote-search-virtual.tsx"></code>

## 示例：级联下拉（父子联动 + 监听表单变更）
<code src="./demos/cascading-select.tsx"></code>

## 示例：跨区块联动（Block 间同步）
<code src="./demos/cross-block-linkage.tsx"></code>

## 示例：多选标签（可创建）
<code src="./demos/tags-creatable.tsx"></code>

## 相关
- 只读展示：参见 JSFieldModel。
- 表单中的自定义“非字段项”：参见 JSItemModel。
