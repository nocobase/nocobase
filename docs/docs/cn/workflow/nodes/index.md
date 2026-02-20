# 概述

一个工作流通常由若干个操作步骤连接而成，每个节点代表一个操作步骤，是流程中的基本逻辑单元。正如编程语言，不同类型的节点代表不同的指令，决定了节点的行为。当流程运行时，系统会依次进入每个节点并执行节点的指令。

:::info{title=提示}
工作流的触发器不属于节点，只是以入口节点的形式展示在流程图中，但与节点是不同的概念，详情请参考[触发器](../triggers/index.md)的内容。
:::

从功能角度，目前已实现的节点可以分为几大类（共 29 种节点）：

- 人工智能
  - [大语言模型](../../ai-employees/workflow/nodes/llm/chat.md)（插件 @nocobase/plugin-workflow-llm 提供）
- 流程控制
  - [条件判断](./condition.md)
  - [多条件分支](./multi-conditions.md)
  - [循环](./loop.md)（插件 @nocobase/plugin-workflow-loop 提供）
  - [变量](./variable.md)（插件 @nocobase/plugin-workflow-variable 提供）
  - [并行分支](./parallel.md)（插件 @nocobase/plugin-workflow-parallel 提供）
  - [调用工作流](./subflow.md)（插件 @nocobase/plugin-workflow-subflow 提供）
  - [流程输出](./output.md)（插件 @nocobase/plugin-workflow-subflow 提供）
  - [JSON 变量映射](./json-variable-mapping.md)（插件 @nocobase/plugin-workflow-json-variable-mapping 提供）
  - [延时](./delay.md)（插件 @nocobase/plugin-workflow-delay 提供）
  - [结束流程](./end.md)
- 计算
  - [计算](./calculation.md)
  - [日期计算](./date-calculation.md)（插件 @nocobase/plugin-workflow-date-calculation 提供）
  - [JSON 计算](./json-query.md)（插件 @nocobase/plugin-workflow-json-query 提供）
- 数据表操作
  - [新增数据](./create.md)
  - [更新数据](./update.md)
  - [删除数据](./destroy.md)
  - [查询数据](./query.md)
  - [聚合查询](./aggregate.md)（插件 @nocobase/plugin-workflow-aggregate 提供）
  - [SQL 操作](./sql.md)（插件 @nocobase/plugin-workflow-sql 提供）
- 人工处理
  - [人工处理](./manual.md)（插件 @nocobase/plugin-workflow-manual 提供）
  - [审批](./approval.md)（插件 @nocobase/plugin-workflow-approval 提供）
  - [抄送](./cc.md)（插件 @nocobase/plugin-workflow-cc 提供）
- 其他扩展
  - [HTTP 请求](./request.md)（插件 @nocobase/plugin-workflow-request 提供）
  - [JavaScript](./javascript.md)（插件 @nocobase/plugin-workflow-javascript 提供）
  - [邮件发送](./mailer.md)（插件 @nocobase/plugin-workflow-mailer 提供）
  - [通知](../../notification-manager/index.md#工作流通知节点)（插件 @nocobase/plugin-workflow-notification 提供）
  - [响应](./response.md)（插件 @nocobase/plugin-workflow-webhook 提供）
  - [响应消息](./response-message.md)（插件 @nocobase/plugin-workflow-response-message 提供）
