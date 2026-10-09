---
title: '概览'
description: '选择 NocoBase 3 工作流内置的 Run、Condition 和 Terminate 节点。'
keywords: 'NocoBase,工作流节点,Run,Condition,Terminate'
---

# 概览

节点是工作流中具有独立业务意义、可以被记录和观察的步骤。不要把每次函数调用或数据库查询都拆成节点；一个节点内部可以通过类型化 Service 完成一项原子业务动作。

## 内置节点

| 目标                         | 节点      | 文档                             |
| ---------------------------- | --------- | -------------------------------- |
| 执行计算、数据操作或外部调用 | Run       | [Run 节点](./run.md)             |
| 根据布尔条件选择路径         | Condition | [Condition 节点](./condition.md) |
| 提前结束本次流程             | Terminate | [Terminate 节点](./terminate.md) |

这三种节点分别对应“做一件事”“决定走哪条路”和“到此结束”。应用可以通过其他插件扩展节点类型，但定义工作流前必须先确认目标应用实际注册了这些能力。

## 所有节点共有的字段

每个节点都具有稳定且全局唯一的 `key`，还可以提供面向管理界面的 `title` 和 `description`。`config` 由具体节点类型定义；`result` 描述后续节点可以引用的结果结构。

节点标题和描述可以随版本调整，`key` 应在业务含义不变时保持稳定，以便关联历史、诊断和结果引用。

## 扩展节点能力

当缺失能力是可复用的流程控制语义，或多个流程需要具有独立配置和结果合同的可复用操作时，才考虑实现自定义 Instruction。普通业务动作优先使用 Run + Service。自定义能力必须同时交给源码检查器、Artifact 构建过程和运行时注册表。让应用 Agent 先使用 Workflow Skill 检查现有插件，参见[使用 Workflow Skill](../using-skill.md)和[Service API](../service-api.md)。

需要直接套用的完整实现可参考 [Service API 的发邮件节点示例](../service-api.md#可运行示例发邮件节点)，其中包含公开导入、异步 Provider、checker/build 合同、隔离 Artifact 输出和运行时注册。
