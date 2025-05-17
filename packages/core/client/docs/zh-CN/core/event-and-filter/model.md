# Model

## Markdown Block

通过 filterflow + observable models 方式构建的简单 Markdown 区块。分为两部分
1. filterFlow的注册初始化，Plugin 启动时通过 this.app.filterFlowManager 注册必要的 filters
2. Markdown组件: 该组件会读取对应的model信息，并应用filterflow获得最终可渲染的组件属性

内核会提供 FilterFlow 通用的配置组件，通过传入uid能够自动显示配置filterflow的组件

<code src="./demos/models/markdown.tsx"></code>
