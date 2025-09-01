# 错误回退：表格列（RenderFunction）

当表格列使用 `RenderFunction` 渲染且单元格发生异常时，可以在列的 `render()` 返回的函数中用局部 `ErrorBoundary` 包裹，从而仅替换单元格内容为回退信息，同时保留表格/列的设置外壳，便于继续配置或删除该列。

<code src="./table-column-error.tsx"></code>
