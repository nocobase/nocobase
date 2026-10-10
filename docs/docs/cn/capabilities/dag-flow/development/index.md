---
title: '使用 Agent 开发'
description: '在 NocoBase 3 应用开发流程中，通过应用 Agent 设计、接入与验证工作流。'
keywords: 'NocoBase,应用开发,工作流,Workflow Skill,DSL'
---

# 使用 Agent 开发

本部分面向使用 NocoBase 3 应用模板、通过应用 Agent 开发业务应用的人员。当应用开发中的某个业务场景需要工作流时，人负责描述业务、补充约束、审核方案和确认风险；Agent 负责检查当前应用、实现代码并提供验证证据。内容按这条协作路径组织。

## 开发路径

1. [使用 Workflow Skill](./using-skill.md)分析需求并让应用 Agent 检查现有能力。
2. [从业务需求到工作流](./design.md)确定流程、业务代码和副作用边界。
3. 使用[工作流定义 DSL](./dsl.md)表达输入、参数和流程结构。
4. 从[内置节点](./nodes/index.md)中选择已有流程语义。
5. 通过[Service API](./service-api.md)把真实业务事件接入工作流。
6. 按[检查、构建与诊断](./verification-and-diagnostics.md)验证并发布版本。

## 按任务选择

| 任务                      | 文档                                                  |
| ------------------------- | ----------------------------------------------------- |
| 判断需求是否适合工作流    | [从业务需求到工作流](./design.md)                     |
| 让 Agent 创建或修改工作流 | [使用 Workflow Skill](./using-skill.md)               |
| 定义输入、参数或流程结构  | [工作流定义 DSL](./dsl.md)                            |
| 执行业务动作              | [Run 节点](./nodes/run.md)                            |
| 根据条件选择路径          | [Condition 节点](./nodes/condition.md)                |
| 提前结束流程              | [Terminate 节点](./nodes/terminate.md)                |
| 从业务代码触发流程        | [Service API](./service-api.md)                       |
| 检查、构建或排查异常      | [检查、构建与诊断](./verification-and-diagnostics.md) |

## 最小心智模型

开发工作流时只需要先记住三件事：

1. 应用源码中的一个工作流目录描述一种业务过程；
2. 每次被接受的业务事件会产生一条固定到具体版本的运行记录；
3. 工作流负责编排，具体数据操作仍由应用的类型化业务代码负责。

## 推荐工作方式

先用自然语言把业务目标、触发事件、规则和副作用交给应用 Agent，让它读取插件同步到应用中的 Workflow Skill。不要预先指定一定使用工作流；先审核 Agent 的选型理由和当前能力检查，再确认会写库、发消息或调用外部系统的动作。完成修改后，验收真实的检查、测试、构建和必要运行证据，而不是只接受“已经完成”的结论。

如果只想体验完整流程，从[快速开始](../quick-start.md)开始。
