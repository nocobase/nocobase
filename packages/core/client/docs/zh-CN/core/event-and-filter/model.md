# Model

## Markdown Block

通过 flow engine 方式构建的简单 Markdown 区块。分为两部分
1. flow的注册初始化，Plugin 启动时通过 this.app.flowEngine 注册必要的 flows
2. Markdown组件: 该组件会读取对应的model信息，并应用flow获得最终可渲染的组件属性

内核会提供 Flow 通用的配置组件，通过传入uid等必要属性后能够自动显示配置flow sep的组件

<code src="./demos/models/markdown.tsx"></code>

## Action
这个示例演示了如何使用FlowEngine实现一个删除按钮，包含确认弹窗和请求处理
<code src="./demos/models/action.tsx"></code>

## Table Block

<code src="./demos/models/table.tsx"></code>