# 错误回退：CreateForm beforeRender事件流异常

当beforeRender事件流执行过程中发生异常时，错误将被提升为渲染期错误并由外层错误边界捕获。

<code src="./create-form-auto-flows-error.tsx"></code>

