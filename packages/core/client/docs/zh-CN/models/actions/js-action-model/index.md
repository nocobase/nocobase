# JSActionModel

JSActionModel 提供了在按钮点击时执行自定义 JavaScript 的能力，适用于 collection 操作和 record 操作（单行操作）。脚本会在沙箱中运行，默认暴露 Flow 上下文，可调用资源、消息提示、弹窗等 API。

## JSCollectionActionModel

<code src="./demos/collection-action.tsx"></code>

常用上下文：

- `ctx.resource`：当前区块的 `MultiRecordResource`，可调用 `getSelectedRows()`、`refresh()` 等方法。
- `ctx.collection` / `ctx.dataSource`：当前集合、数据源实例，可读取字段信息或拼接请求。
- `ctx.message` / `ctx.modal` / `ctx.viewer`：Ant Design 的提示、弹窗、抽屉等能力。
- `ctx.api`：已经注入的 APIClient，可发起自定义请求。
- 其他通用能力：`ctx.runjs`、`ctx.t`、`ctx.logger` 等。

典型场景：批量处理、导出选中、快速标记状态等。示例演示了在表格顶部放置批量按钮，读取选中行并弹出自定义抽屉。

## JSRecordActionModel

<code src="./demos/record-action.tsx"></code>

常用上下文：

- `ctx.record`：当前行数据；`ctx.filterByTk`：主键值。
- `ctx.collection` / `ctx.resource`：区块所在集合及资源，单记录场景通常是 `SingleRecordResource`。
- `ctx.message` / `ctx.viewer` / `ctx.modal`：用于反馈结果或打开浮层。
- `ctx.api`：在行内直接发起接口请求（如触发审批、调用 webhook 等）。

典型场景：行内查看详情、触发外部请求、快速跳转。示例展示了行内“查看详情”按钮，通过 `ctx.viewer.drawer` 打开自定义抽屉。

> 提示：脚本运行在安全环境，不建议直接操作 DOM 以外的全局对象；
