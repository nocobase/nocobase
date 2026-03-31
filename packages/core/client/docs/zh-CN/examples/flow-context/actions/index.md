# Actions 上下文

:::info
Actions 相关方法由 `FlowRuntimeContext` 提供，在流执行过程中可以使用。
:::

## 主要方法

### `ctx.runAction(name, params?)`

执行指定的 action，支持传递参数。

### `ctx.getAction(name)`

获取单个 action 的定义信息。

### `ctx.getActions()`

获取所有可用的 actions Map。

## 使用场景

- 动态执行已注册的 actions
- 查询可用的 actions 列表
- 根据条件选择性执行不同的 actions
- 实现 子action 的调用

## 基础示例
<!-- 
<code src="./basic.tsx"></code> -->