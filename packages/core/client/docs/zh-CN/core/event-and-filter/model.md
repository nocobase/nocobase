# Model

## Markdown Block

通过 flow engine 方式构建的简单 Markdown 区块。分为两部分
1. flow的注册初始化，Plugin 启动时通过 this.app.flowEngine 注册必要的 flows
2. Markdown组件: 该组件会读取对应的model信息，并应用flow获得最终可渲染的组件属性

内核会提供 Flow 通用的配置组件，通过传入uid等必要属性后能够自动显示配置flow sep的组件

<code src="./demos/models/markdown.tsx"></code>

## Action
这个示例演示了如何使用FlowEngine实现一个删除按钮，包含确认弹窗和请求处理

**使用说明**: 右键点击下方的按钮，可以打开配置菜单修改弹窗标题和内容等参数。

<code src="./demos/models/action.tsx"></code>

## Table Block

这个示例展示了一个完整的表格组件，包含数据加载、分页、字段配置等功能。

**使用说明**: 右键点击下方的表格区域，可以打开配置菜单设置显示字段、表格标题等参数。

<code src="./demos/models/table.tsx"></code>