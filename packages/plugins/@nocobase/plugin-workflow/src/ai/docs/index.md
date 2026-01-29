---
title: "工作流"
description: "综述工作流插件的核心模型、触发器、节点关系与编排步骤。"
---

# 工作流

本文档从服务端视角总结 plugin-workflow 的核心架构与 API，用于 AI Agent 进行“创建工作流 + 逐步添加节点”的基本编排参考。节点配置的细节不在本文展开，请直接查阅 `packages/plugins/@nocobase/plugin-workflow/src/ai/docs/nodes/` 下对应文档。

## 数据模型（核心表与关系）

- `workflows`：工作流主表，`type` 为触发器类型，`config` 为触发器配置，`enabled` 控制是否启用，`sync` 控制同步/异步执行，`options` 存放引擎行为参数（如栈限制、自动清理执行记录等），`key` 用于版本分组，`current` 标识当前版本。
- `flow_nodes`：节点表，`workflowId` 关联工作流，`type` 节点类型，`config` 节点配置，`upstreamId`/`downstreamId` 构成链式结构，`branchIndex` 表示分支序号，`key` 用于跨版本引用与结果映射。
- `executions`：执行记录，`workflowId` 关联工作流版本，`context` 触发上下文，`status` 执行状态，`eventKey` 用于去重，`stack` 用于防止递归触发，`output` 存放输出节点结果。
- `jobs`：节点执行记录，`executionId` 关联执行，`nodeId`/`nodeKey` 对应节点，`status` 节点执行状态，`result`/`meta` 存放节点输出与元数据。

## 触发器（Trigger）

触发器类型通过 `workflows.type` 选择，当前内置：

- `collection`：监听数据表事件（新增、更新和删除）。根据 `workflow.config` 中的条件与字段变更判断是否触发。
- `schedule`：定时触发，分为 `static`（固定时间/cron/间隔）与 `date field`（按字段时间触发）。内部使用定时器缓存未来一段时间内的触发点。

## 编排工作流的建议步骤

根据用户输入的需求，整理为一个工作流的方案，描述清楚何时触发，以及期待实现的逻辑，之后根据方案创建工作流，或在已有的工作流中根据业务逻辑添加相关的处理节点。

### 前端界面上与用户协同操作

大部分操作通过调用 HTTP API 完成，与用户自身操作的效果一致。建议的步骤如下：

1. 创建 workflow：调用 `workflows:create`，指定 `type` 与 `config`（触发器配置）。
2. 创建工作流之后，根据返回数据中的 `id`，跳转至工作流的配置界面（`/admin/`）。
3. 配置触发器：调用 `workflows:update` 更新 `config`。
4. 按顺序创建节点：调用 `workflows/{workflowId}/nodes:create`，用 `upstreamId` 连接链路；分支节点使用 `branchIndex`。
5. 配置节点：调用 `flow_nodes:update` 写入 `config`。
6. 发布启用：调用 `workflows:update` 设置 `enabled=true`。
7. 触发执行：通过业务事件自动触发，或调用 `workflows:execute` 手动触发。

### 服务端后台操作

如使用服务端 AI 工具，可以直接操作数据表的接口完成相关步骤，但需要注意的是，直接调用数据表接口时，某些逻辑（如版本管理、节点连接等）需要自行处理。建议的步骤如下：

1. 在 `workflows` 表创建记录，设置 `type`、`config`、`enabled`、`sync`、`options`、`current`。
2. 在 `flow_nodes` 表创建节点记录，设置 `workflowId`、`type`、`upstreamId`、`downstreamId`、`branchIndex` 和 `config`。
3. 如需修改，可以调用更新接口修改 `workflows` 或 `flow_nodes` 表的记录。
4. 基于当前工作流创建新版本可以使用 `workflowRepository.revision` 方法。
5. 在执行完任意变更后，可以提示用户跳转到对应的页面上或刷新数据以检查结果。
