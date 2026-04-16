---
title: 自定义界面配置
---

# 自定义界面配置

审批节点的界面搭建能力直接复用 `flowSurfaces` API，不新增独立的审批 API resource。

与普通页面搭建不同的是，审批界面有自己专属的 FlowModel、区块、动作和字段包装器，因此只能在审批 surface 下使用对应的搭建能力。
对于既有审批界面的增量编辑，如果你手里只有 `workflowId` 或 `nodeId`，要先从 workflow / node 配置里解析出已绑定的 `approvalUid` 或 `taskCardUid`，再进入 `flowSurfaces:get|catalog|addBlock|addField|addAction|compose|configure`。

## 搭建路由

- whole-surface 初始化 / replace -> `flowSurfaces:applyApprovalBlueprint`
- 既有 approval root 的局部编辑 -> `flowSurfaces:get|catalog|addBlock|addField|addAction|compose|configure`

`v1` 不支持 schema 相关配置，也不负责审批 schema wiring。

## 适用场景

- 审批发起页配置
- 审批处理页配置
- 审批任务卡片配置

## 目标 surface

### 发起页

- `TriggerChildPageModel`
- `TriggerChildPageTabModel`
- `TriggerBlockGridModel`

### 处理页

- `ApprovalChildPageModel`
- `ApprovalChildPageTabModel`
- `ApprovalBlockGridModel`

### 任务卡片

- workflow 侧:
  - `ApplyTaskCardDetailsModel`
  - `ApplyTaskCardGridModel`
- node 侧:
  - `ApprovalTaskCardDetailsModel`
  - `ApprovalTaskCardGridModel`

## 可添加区块

### 发起页区块

- `approvalInitiator`
  - 持久化为 `ApplyFormModel`
  - 只能添加到 `TriggerBlockGridModel`
  - 创建时会自动带上一个默认的 `approvalSubmit`

### 处理页区块

- `approvalApprover`
  - 持久化为 `ProcessFormModel`
  - 只能添加到 `ApprovalBlockGridModel`
- `approvalInformation`
  - 持久化为 `ApprovalDetailsModel`
  - 只能添加到 `ApprovalBlockGridModel`

`TriggerBlockGridModel` 和 `ApprovalBlockGridModel` 都是审批专用 block 容器。普通页面里的 generic block，例如 `markdown`、`iframe`、`table`、`list`，都不应该出现在这些容器的 catalog 中，也不能被 `addBlock` / `compose` 写入。

## 可添加动作

### 发起页动作

- `approvalSubmit`
- `approvalSaveDraft`
- `approvalWithdraw`

### 处理页动作

- `approvalApprove`
- `approvalReject`
- `approvalReturn`
- `approvalDelegate`
- `approvalAddAssignee`

审批动作是审批运行时配置的一部分，不只是 FlowModel 按钮:

- `approvalInitiator` 创建时会自动补一个默认的 `approvalSubmit`。
- `approvalSubmit`、`approvalSaveDraft`、`approvalWithdraw` 在同一个发起表单内只能各存在一个。
- `approvalApprove`、`approvalReject`、`approvalReturn`、`approvalDelegate`、`approvalAddAssignee` 在同一个处理表单内只能各存在一个。
- `flowSurfaces:catalog` 会隐藏当前表单里已经存在的 singleton 审批动作。所以一个新建的发起表单通常不会再在 catalog 里看到 `approvalSubmit`，因为默认 submit 已经存在了。
- `approvalWithdraw` 会同步到 `workflow.config.withdrawable`。
- 处理页动作会同步到审批节点的 `node.config.actions`，例如同一处理表单内存在 approve / reject / return / delegate / addAssignee 时，会同步为 `[2, -1, 1, 8, 99]`。
- `approvalReturn` 的退回配置会同步到 `node.config.returnTo` 和 `node.config.returnToNodeVariable`。
- `approvalDelegate` 和 `approvalAddAssignee` 的人员范围会同步到 `node.config.toDelegateReassignees` / `node.config.toAddReassignees` 及对应 options。

对于已有 approval root 的局部编辑，推荐通过 `flowSurfaces:addAction` 或 `flowSurfaces:compose` 创建审批动作，再通过 `flowSurfaces:configure` 修改审批动作配置。不要直接只改 FlowModel 字符串而绕过 `flowSurfaces` 写接口，否则审批运行时配置不会被同步。

## 字段搭建语义

### 发起/处理表单

- 表单 block:
  - `ApplyFormModel`
  - `ProcessFormModel`
- 表单 grid:
  - `PatternFormGridModel`
- 表单 wrapper:
  - `PatternFormItemModel`
- inner field:
  - `PatternFormFieldModel`

当你在审批表单下调用 `addField` 时，服务端会自动把字段树持久化成:

```text
PatternFormItemModel
└── PatternFormFieldModel
```

并把真实字段组件 use 记录到 `stepParams.fieldBinding.use`。

`flowSurfaces:configure` 对审批表单 wrapper 写入 `fieldComponent` 时，也会继续保持这个约束:

- inner field 的 FlowModel use 仍然是 `PatternFormFieldModel`
- 真正的字段组件 use 只更新到 `stepParams.fieldBinding.use`
- 不会把 approval form 的 inner field 改写成普通页面里的真实字段模型

### 审批信息详情

- details block:
  - `ApprovalDetailsModel`
- details grid:
  - `ApprovalDetailsGridModel`
- details wrapper:
  - `ApprovalDetailsItemModel`

## 推荐调用顺序

### Blueprint 初始化

**如果目标是首次初始化或整页替换审批界面，优先使用 `flowSurfaces:applyApprovalBlueprint`。**

不要用 `compose` 启动一个全新的 approval surface；`compose` 只适用于 approval root 已存在之后的局部批量编排。

如果你需要先把 approval root 创建出来，并直接完成一次 replace 式初始化，使用 `flowSurfaces:applyApprovalBlueprint`：

1. `surface: "initiator"` + `workflowId`
   - 自动创建 / 复用 `TriggerChildPageModel`
   - 自动回写 `workflow.config.approvalUid`
   - 用 `blocks + layout` 初始化发起页
2. `surface: "approver"` + `nodeId`
   - 自动创建 / 复用 `ApprovalChildPageModel`
   - 自动回写 `node.config.approvalUid`
   - 用 `blocks + layout` 初始化处理页
3. `surface: "taskCard"` + `workflowId | nodeId`
   - 自动创建 / 复用对应的任务卡详情 root
   - 自动回写 `taskCardUid`
   - 用 `fields + layout` 初始化任务卡

`applyApprovalBlueprint` 当前只支持 `version: "1"` 和 `mode: "replace"`。对发起页和处理页，replace 会替换 approval root 下的页面区块内容；对任务卡，replace 会替换任务卡详情字段和布局。传入无效字段、非法 target 或重复 key 会返回 400。

发起页初始化示例:

```json
{
  "surface": "initiator",
  "workflowId": 1,
  "blocks": [
    {
      "key": "applyForm",
      "type": "approvalInitiator",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "expenses"
      },
      "fields": ["title", "amount"],
      "actions": ["approvalSaveDraft", "approvalWithdraw"]
    }
  ],
  "layout": {
    "rows": [["applyForm"]]
  }
}
```

这里不需要显式声明 `approvalSubmit`，因为 `approvalInitiator` 默认已经带一个 submit。

处理页初始化示例:

```json
{
  "surface": "approver",
  "nodeId": 10,
  "blocks": [
    {
      "key": "process",
      "type": "approvalApprover",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "expenses"
      },
      "fields": ["title", "amount"],
      "actions": [
        "approvalApprove",
        "approvalReject",
        {
          "type": "approvalReturn",
          "settings": {
            "approvalReturn": {
              "type": "count",
              "count": 1
            }
          }
        },
        {
          "type": "approvalDelegate",
          "settings": {
            "assigneesScope": {
              "assignees": [1],
              "extraFieldKey": "departmentId"
            }
          }
        }
      ]
    },
    {
      "key": "information",
      "type": "approvalInformation",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "expenses"
      },
      "fields": ["status"]
    }
  ],
  "layout": {
    "rows": [["process"], ["information"]]
  }
}
```

任务卡初始化示例:

```json
{
  "surface": "taskCard",
  "nodeId": 10,
  "fields": [
    {
      "key": "title",
      "fieldPath": "title"
    },
    {
      "key": "amount",
      "fieldPath": "amount"
    }
  ],
  "layout": {
    "rows": [["title", "amount"]]
  }
}
```

### 审批动作配置

以下配置都属于既有 approval root 的增量编辑路径，不用于首次初始化。

`approvalReturn` 支持通过 `flowSurfaces:configure` 写入退回设置:

```json
{
  "target": {
    "uid": "return-action-uid"
  },
  "changes": {
    "approvalReturn": {
      "type": "count",
      "count": 2
    }
  }
}
```

常见取值:

- `{ "type": "start" }` 表示退回到发起。
- `{ "type": "any" }` 表示退回任意节点。
- `{ "type": "count", "count": 2 }` 表示按上游步数退回。
- `{ "type": "specific", "target": "node-key" }` 表示退回指定节点。

`approvalDelegate` 和 `approvalAddAssignee` 支持通过 `assigneesScope` 写入人员范围:

```json
{
  "target": {
    "uid": "delegate-action-uid"
  },
  "changes": {
    "assigneesScope": {
      "assignees": [1, 2],
      "extraFieldKey": "departmentId"
    }
  }
}
```

### 批量编排

如果 approval root 已经存在，并且你只是要做局部批量改造，可以使用 `flowSurfaces:compose`：

1. 先用 `flowSurfaces:get` / `flowSurfaces:catalog` 确认 approval root 已存在，并读取当前允许的 block / action 类型。
2. 用 `flowSurfaces:compose` 一次性声明 blocks、fields、actions 和 layout。
3. 容器合法性仍会在真实写入阶段校验，因此普通 `BlockGridModel` 下提交 approval blocks 会被拒绝。
4. 批量创建完成后，再用 `flowSurfaces:configure` 做局部调整。

### 先解析既有 root，再做增量编辑

如果你当前只有 `workflowId` 或 `nodeId`，还不知道 approval root 的 `uid`，先从绑定记录解析：

- 发起页增量编辑
  - 先读取 workflow
  - 使用 `workflow.config.approvalUid`
  - 如果为空，说明还没有既有界面，回到 `flowSurfaces:applyApprovalBlueprint(surface="initiator")`
- 处理页增量编辑
  - 先读取 node
  - 使用 `node.config.approvalUid`
  - 如果为空，回到 `flowSurfaces:applyApprovalBlueprint(surface="approver")`
- workflow 侧任务卡增量编辑
  - 先读取 workflow
  - 使用 `workflow.config.taskCardUid`
  - 如果为空，回到 `flowSurfaces:applyApprovalBlueprint(surface="taskCard")`
- node 侧任务卡增量编辑
  - 先读取 node
  - 使用 `node.config.taskCardUid`
  - 如果为空，回到 `flowSurfaces:applyApprovalBlueprint(surface="taskCard")`

拿到 root `uid` 之后，再进入 `flowSurfaces:get|catalog|addBlock|addField|addAction|compose|configure`。

## 限制

- approval blocks 不会出现在普通页面 `BlockGridModel` 的 catalog 中。
- approval 专用 block grid 也不会暴露 generic block。
- approval actions 不能添加到普通 form block。
- approval form catalog 不暴露 `jsItem`，并且 `flowSurfaces:addField` 也不允许在审批表单下直接添加 `type: "jsItem"`。
- 不支持通过新建 approval provider 的方式扩展写入语义，统一走 `flowSurfaces` 现有端点。
- 任务卡详情相关模型会被 `flowSurfaces` 识别为 details surface，但当前不作为独立 public block key 暴露。
## OpenAPI / Skill 合同

approval 专用 public key 已经纳入 `flowSurfaces` 的 Swagger / OpenAPI 合同:

- `approvalInitiator`
- `approvalApprover`
- `approvalInformation`
- `approvalSubmit`
- `approvalSaveDraft`
- `approvalWithdraw`
- `approvalApprove`
- `approvalReject`
- `approvalReturn`
- `approvalDelegate`
- `approvalAddAssignee`

这意味着 approval 专用 public key 已经属于同一个 `flowSurfaces` 合同面，MCP / Skill / CLI 都应按同样的 authoring route 理解这些 block / action 类型，而不需要依赖额外的私有约定。

workflow skill 在审批场景下应采用同样的路由规则：

- whole-surface 初始化 / replace -> `flowSurfaces:applyApprovalBlueprint`
- approval root 已存在的局部编辑 -> `flowSurfaces:get|catalog|addBlock|addField|addAction|compose|configure`

## 相关 API

- `flowSurfaces:applyApprovalBlueprint`
- `flowSurfaces:catalog`
- `flowSurfaces:addBlock`
- `flowSurfaces:addField`
- `flowSurfaces:addAction`
- `flowSurfaces:compose`
- `flowSurfaces:configure`
