# 错误回退（Error Fallback）

本页汇总并演示三类常见的错误回退场景，便于一次性对比查看：

- CreateForm 字段渲染异常
- CreateForm 自动流（useApplyAutoFlows）异常
- 表格列（RenderFunction）单元格渲染异常

## CreateForm 字段异常

当区块的某个字段渲染函数抛出异常时，FlowModelRenderer 的外层错误边界会捕获并展示回退界面。

<code src="./create-form-field-error.tsx"></code>

## CreateForm 自动流异常

当自动流（useApplyAutoFlows）执行过程中发生异常时，错误将被提升为渲染期错误并由外层错误边界捕获。

<code src="./create-form-auto-flows-error.tsx"></code>

## 表格列（RenderFunction）异常

当表格列使用 RenderFunction 渲染且单元格发生异常时，可在列的 render() 返回的函数中用局部 ErrorBoundary 包裹，仅替换单元格内容为回退信息，同时保留表格/列的设置外壳，便于继续配置或删除该列。

<code src="./table-column-error.tsx"></code>

