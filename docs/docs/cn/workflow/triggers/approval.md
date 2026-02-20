---
pkg: '@nocobase/plugin-workflow-approval'
---

# 审批

## 介绍

审批是一种专用于人工发起且由人工处理以决定相关数据状态的流程形式。通常用于办公自动化或其他人工决策事务的流程管理，例如可以创建并管理“请假申请”、“费用报销审批”和“原料采购审批”等场景的人工流程。

审批插件提供了专用的工作流类型（触发器）“审批（事件）”和专用于该流程的“审批”节点，结合 NocoBase 特有的自定义数据表和自定义区块，可以快速且灵活地创建与管理各类审批场景。

## 创建流程

创建工作流时选择“审批”类型，即可创建审批流程：

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

之后在工作流配置界面中点击触发器打开弹窗进行更多的配置。

## 触发器配置

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### 绑定数据表

NocoBase 的审批插件基于灵活性的设计，可以与任意自定义数据表配合使用，即审批配置无需重复配置数据模型，而是直接复用已创建的数据表。所以在进入触发器配置后，首先需要选择数据表，以决定该流程针对哪个数据表的数据进行审批：

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/20251226103223.png)

### 触发方式

针对业务数据发起审批时，可以选择以下两种触发方式：

*   **数据保存前**

    在提交的数据保存之前发起审批，适用于需要在审批通过后才保存数据的场景。在该模式下，审批发起时的数据仅为临时数据，只有在审批通过后才会正式保存到对应的数据表中。

*   **数据保存后**

    在提交的数据保存之后发起审批，适用于数据可以先保存，再进行审批的场景。在该模式下，审批发起时的数据已经保存到对应的数据表中，审批过程中对其的修改也会保存。

### 发起审批的位置

可以选择在系统中发起审批的位置：

*   **仅在数据区块中发起**

    可以将该表的任意表单区块的操作绑定到该工作流，用于发起审批，并在单条数据的审批区块里处理和跟踪审批过程，通常适用于业务数据。

*   **在数据区块和待办中心都可以发起**

    除了数据区块，还可以在全局的待办中心发起和处理审批，这通常适用于行政数据。

### 谁可以发起审批

可以配置基于用户范围的权限，决定哪些用户可以发起该审批：

*   **所有用户**

    系统中的所有用户均可发起该审批。

*   **仅已选择的用户**

    仅允许指定范围的用户发起该审批，可以多选。

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### 发起审批的表单界面配置

最后需要配置发起人的表单界面，该界面将用于从审批中心区块发起时和用户撤回后重新发起时的提交操作。点击配置按钮打开弹窗：

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/20251226130239.png)

可以为发起人的界面添加基于绑定的数据表的填写表单，或用以提示和引导的说明文案（Markdown）。其中表单是必须添加的，否则发起人进入到该界面后将无法操作。

添加表单区块后，和普通表单配置界面一样，可以添加对应数据表的字段组件，并且可以任意排列，以组织表单需要填写的内容：

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/20251226130339.png)

区别于直接提交的按钮，还可以增加“保存草稿”的操作按钮，用于支持暂存的处理流程：

![审批触发器_触发器配置_发起人表单_操作配置_保存](https://static-docs.nocobase.com/20251226130512.png)

如果一个审批流程允许发起人撤回，需要在发起人界面配置中，启用“撤回”按钮：

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251226130637.png)

启用后该流程发起的审批在任何审批人处理之前均可被发起人撤回，但在任何后续审批节点配置的审批人处理过后，将不再可被撤回。

:::info{title=提示}
启用或删除撤回按钮后，在触发器配置的弹窗中，需要点击保存提交后才能生效。
:::

### “我的申请”卡片 <Badge>2.0+</Badge>

可用于配置待办中心“我的申请”列表中的任务卡片。

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

卡片中可以自由配置希望展示的业务字段（关系字段除外），或审批相关信息。

在审批申请创建后，待办中心列表即可看到自定义的任务卡片：

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### 流程中的记录显示模式

*   **快照**

    在审批流程中，申请人和审批人在进入时看到的记录状态，并且在提交后只能看到自己修改的记录——不会看到其他人之后所做的更新。

*   **最新**

    在审批流程中，申请人和审批人在整个流程中始终看到记录的最新版本，无论他们操作之前记录是什么状态。在流程结束后，他们将看到记录的最终版本。

## 审批节点

在审批工作流中，需要使用专用的“审批”节点为审批人配置用于处理（通过、拒绝或退回）发起的审批的操作逻辑，“审批”节点也仅可在审批流程中使用。参考 [审批节点](../nodes/approval.md) 了解详情。

:::info{title=提示}
如果一个审批流程中没有任何“审批”节点，该流程将被自动通过。
:::

## 发起审批配置

在配置好一个审批工作流并启用后，可以将该工作流绑定在对应的数据表的表单提交按钮上，以供用户在提交的时候发起审批：

![发起审批_绑定工作流](https://static-docs.nocobase.com/20251226110710.png)

之后用户对该表单的提交即可触发对应的审批工作流，提交的数据除了保存在对应的数据表中，也会被快照至审批流中，供后续审批人员查阅使用。

:::info{title=提示}
发起审批的按钮目前仅支持使用新增或更新表单中的“提交”（或“保存”）按钮，不支持使用“触发工作流”按钮（该按钮仅可绑定“自定义操作事件”）。
:::

## 待办中心

待办中心提供了一个统一的入口，方便用户查看和处理待办任务，当前用户发起的审批和待办的任务都可以通过顶部工具栏的待办中心进入，并通过左侧的分类导航查看不同类型的待办任务。

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### 我发起的

#### 查看已发起的审批

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### 直接发起新的审批

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### 我的待办

#### 待办列表

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### 待办详情

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### 发起人

#### 数据表发起

从数据区块发起，都可以这样调用（以 `posts` 表创建按钮举例）：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

其中 URL 参数 `triggerWorkflows` 为工作流的 key，多个工作流用逗号分隔。该 key 可在工作流画布顶部工作流名称处鼠标悬浮后获得：

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

调用成功后，将触发对应 `posts` 表的审批工作流。

:::info{title="提示"}
因为外部调用也需要基于用户身份，所以通过 HTTP API 调用时，和普通界面发送的请求一致，都需要提供认证信息，包括 `Authorization` 请求头或 `token` 参数（登录获得的 token），以及 `X-Role` 请求头（用户当前角色名）。
:::

如果需要触发该操作中对一关系数据（对多暂不支持）的事件，可以在参数中使用 `!` 来指定关系字段的触发数据：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

以上调用成功后，将触发对应 `categories` 表的审批事件。

:::info{title="提示"}
通过 HTTP API 调用触发操作后事件时，也需要注意工作流的启用状态，以及数据表配置是否匹配，否则可能不会调用成功，或出现错误。
:::

#### 审批中心发起

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**参数**

* `collectionName`：发起审批的目标数据表名称，必填。
* `workflowId`：发起审批使用的工作流 ID，必填。
* `data`：发起审批时创建的数据表记录字段，必填。
* `status`：发起审批时创建的记录状态，必填。可选值包括：
  * `0`：草稿，表示保存但不提交审批。
  * `2`：提交审批，表示发起人提交审批申请，进入审批。

#### 保存和提交

当发起（或撤回）的审批处于草稿状态时，可以通过以下接口再次保存或提交：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### 获取已发起的审批列表

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### 撤回

发起人可以通过以下接口撤回当前处于审批中的记录：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**参数**

* `<approval id>`：待撤回的审批记录 ID，必填。

### 审批人

审批流程进入审批节点后，会为当前审批人创建待办任务。审批人可以通过界面操作完成审批任务，也可以通过 HTTP API 调用完成。

#### 获取审批处理记录

待办任务即审批处理记录，可以通过以下接口获取当前用户的所有审批处理记录：

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

其中 `approvalRecords` 作为数据表资源，也可以使用通用的查询条件，如 `filter`、`sort`、`pageSize` 和 `page` 等。

#### 获取单个审批处理记录

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### 通过和拒绝

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**参数**

* `<record id>`：待审批处理的记录 ID，必填。
* `status`：字段为审批处理的状态，`2` 表示“通过”，`-1` 表示“拒绝”，必填。
* `comment`：审批处理的备注信息，可选。
* `data`：表示审批通过后对当前审批节点所在数据表记录进行的修改，可选（仅通过时有效）。

#### 退回 <Badge>v1.9.0+</Badge>

在 v1.9.0 版本之前，退回与“通过”、“拒绝”使用相同的接口，使用 `"status": 1` 代表退回。

v1.9.0 版本开始，退回有了单独的接口：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**参数**

* `<record id>`：待审批处理的记录 ID，必填。
* `returnToNodeKey`：退回的目标节点 key，可选。当节点中配置了可退回的节点范围时，可以使用该参数指定退回到哪个节点。未配置的情况下，该参数无需传值，默认将退回到起点，由发起人重新提交。

#### 转签

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**参数**

* `<record id>`：待审批处理的记录 ID，必填。
* `assignee`：转签的用户 ID，必填。

#### 加签

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**参数**

* `<record id>`：待审批处理的记录 ID，必填。
* `assignees`：加签的用户 ID 列表，必填。
* `order`：加签的顺序，`-1` 标识在“我”之前，`1` 标识在“我”之后。
