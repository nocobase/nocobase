# 概述

触发器是工作流的执行入口，当应用运行过程中，满足触发器条件的事件产生时，工作流将会被触发执行。触发器的类型也即工作流的类型，在创建工作流时选择，创建后不可修改。目前已支持的触发器类型如下：

- [数据表事件](./collection)（内置）
- [定时任务](./schedule)（内置）
- [操作前事件](./pre-action)（插件 @nocobase/plugin-workflow-request-interceptor 提供）
- [操作后事件](./post-action)（插件 @nocobase/plugin-workflow-action-trigger 提供）
- [自定义操作事件](./custom-action)（插件 @nocobase/plugin-workflow-custom-action-trigger 提供）
- [审批](./approval)（插件 @nocobase/plugin-workflow-approval 提供）
- [Webhook](./webhook)（插件 @nocobase/plugin-workflow-webhook 提供）

各个事件的触发时机如下图所示：

![工作流的事件](https://static-docs.nocobase.com/20251029221709.png)

例如用户提交一个表单，或者数据表中的数据由于用户操作或程序调用发生变化，或者定时任务到达执行时间，都可以触发已配置的工作流执行。

与数据有关的触发器（如操作、数据表事件）通常会携带触发上下文数据，这些数据会作为变量，可以在工作流中被节点用作处理参数，用以实现数据的自动化处理。例如当用户提交一个表单时，如果提交按钮绑定了工作流的，则会触发并执行该工作流，提交的数据会被注入到执行计划的上下文环境中，以供后续节点作为变量使用。

创建工作流以后，在工作流查看页面中，触发器会以入口节点的样式显示在流程的开始位置，点击该卡片即可打开配置抽屉。根据触发器的类型不同，可以配置触发器的相关条件。

![触发器_入口节点](https://static-docs.nocobase.com/20251029222231.png)
