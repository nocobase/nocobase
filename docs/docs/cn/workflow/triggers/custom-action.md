---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

# 自定义操作事件

## 介绍

NocoBase 内置了常见的数据操作（增删改查等），当这些操作无法满足复杂的业务需求时，可以通过在工作流中使用自定义操作事件，并将该该事件绑定到页面区块的“触发工作流”的按钮上，用户点击后，将会触发一个自定义操作的工作流。

## 创建工作流

创建工作流时，选择“自定义操作事件”：

![创建“自定义操作事件”工作流](https://static-docs.nocobase.com/20240509091820.png)

## 触发器配置

### 上下文类型

> v.1.6.0+

上下文类型的不同会决定该工作流可以被绑定在哪些区块的按钮上：

* 无上下文：即全局事件，可以绑定在操作面板、数据区块的操作按钮上；
* 单行数据：可以绑定在表格数据行、表单、详情等数据区块的操作按钮上；
* 多行数据：可以绑定在表格的批量操作按钮上。

![触发器配置_上下文类型](https://static-docs.nocobase.com/20250215135808.png)

### 数据表

当上下文类型是单行数据或多行数据时，需要选择要绑定数据模型的数据表：

![触发器配置_选择数据表](https://static-docs.nocobase.com/20250215135919.png)

### 待使用的关系数据

如果需要在工作流中使用触发数据行的关联数据，可以在这里选择深层的关联字段：

![触发器配置_选择待使用的关系数据](https://static-docs.nocobase.com/20250215135955.png)

这些字段会在事件触发后自动预加载到工作流的上下文中，以便在工作流中使用。

## 操作配置

根据工作流配置的上下文类型不同，在不同区块的操作按钮配置也有所区别。

### 无上下文

> v1.6.0+

在操作面板和其他数据区块，均可添加“触发工作流”按钮：

![区块添加操作按钮_操作面板](https://static-docs.nocobase.com/20250215221738.png)

![区块添加操作按钮_日历](https://static-docs.nocobase.com/20250215221942.png)

![区块添加操作按钮_甘特图](https://static-docs.nocobase.com/20250215221810.png)

添加按钮后绑定之前创建的无上下文的工作流，以操作面板中的按钮为例：

![按钮绑定工作流_操作面板](https://static-docs.nocobase.com/20250215222120.png)

![选择要绑定的工作流_无上下文](https://static-docs.nocobase.com/20250215222234.png)

### 单行记录

在任意数据区块中，对单行数据的操作栏中都可以添加“触发工作流”按钮，如表单、表格的数据行、详情等：

![区块添加操作按钮_表单](https://static-docs.nocobase.com/20240509165428.png)

![区块添加操作按钮_表格行](https://static-docs.nocobase.com/20240509165340.png)

![区块添加操作按钮_详情](https://static-docs.nocobase.com/20240509165545.png)

添加按钮后绑定之前创建的工作流：

![按钮绑定工作流](https://static-docs.nocobase.com/20240509165631.png)

![选择要绑定的工作流](https://static-docs.nocobase.com/20240509165658.png)

之后点击此按钮即可触发该自定义操作事件：

![点击按钮的触发结果](https://static-docs.nocobase.com/20240509170453.png)

### 多行记录

> v1.6.0+

在表格区块的操作栏中，添加“触发工作流”按钮时会有一个额外选项，选择上下文类型是“无上下文”或“多行数据”：

![区块添加操作按钮_表格](https://static-docs.nocobase.com/20250215222507.png)

当选择“无上下文”时，即为全局事件，仅能绑定无上下文类型的工作流。

当选择“多行数据”时，可以绑定多行数据类型的工作流，可以用于多选数据后的批量操作（目前仅表格支持）。此时可选的工作流范围仅为配置了匹配当前数据区块数据表的工作流：

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

在点击按钮触发时，必须已经勾选了表格中的部分数据行，否则将不会触发工作流：

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## 示例

例如，我们有一个“样品”数据表，针对“已采集”（状态）的样品，需要提供一个“送检”的操作，送检会先检查样品的基本信息，然后生成一条“送检记录”数据，再把样品状态修改为“已送检”。而这一系列过程无法通过简单的“增删改查”按钮点击完成，这时就可以使用自定义操作事件来实现。

先创建一张“样品”数据表和一张“送检记录”数据表，对样品表录入基本的测试数据：

![示例_样品数据表](https://static-docs.nocobase.com/20240509172234.png)

然后创建一个“自定义操作事件”工作流，如果需要操作流程有比较及时的反馈，可以选择同步模式（同步模式下不能使用人工处理等异步类型的节点）：

![示例_创建工作流](https://static-docs.nocobase.com/20240509173106.png)

在触发器配置中，数据表选择“样品”：

![示例_触发器配置](https://static-docs.nocobase.com/20240509173148.png)

根据业务需求，编排流程中的逻辑，例如指标参数大于 `90` 时才允许送检，否则提示相关问题：

![示例_业务逻辑编排](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=提示}
"[响应消息](../nodes/response-message.md)"节点可以在同步的自定义操作事件中使用，用于返回给客户端的提示信息。异步模式下无法使用。
:::

配置好流程并启用后，再返回表格界面，在表格的操作列中添加“触发工作流”的按钮：

![示例_添加操作按钮](https://static-docs.nocobase.com/20240509174525.png)

然后在按钮的配置菜单中选择绑定工作流，打开配置弹窗：

![示例_打开绑定工作流弹窗](https://static-docs.nocobase.com/20240509174633.png)

添加之前启用的工作流：

![示例_选择工作流](https://static-docs.nocobase.com/20240509174723.png)

提交后，再将按钮文本修改为操作名称，如“送检”字样，配置流程就完成了。

使用时，在表格中任选一条样品数据，并点击“送检”按钮，即可触发自定义操作事件。正如之前编排的逻辑，如果样品指标参数小于 90，点击后则会如下提示：

![示例_指标不满足送检](https://static-docs.nocobase.com/20240509175026.png)

如果指标参数大于 90，则会正常执行流程，生成“送检记录”数据，并将样品状态修改为“已送检”：

![示例_送检成功](https://static-docs.nocobase.com/20240509175247.png)

至此，一个简单的自定义操作事件就完成了。同样的，对类似有复杂操作的业务，如订单处理、提交报告等，都可以通过自定义操作事件来实现。

## 外部调用

自定义操作事件的触发不仅限于用户界面的操作，也可以通过 HTTP API 调用触发。特别地，自定义操作事件为所有数据表操作都提供了触发工作流的新操作类型：`trigger`，可安装 NocoBase 标准的操作 API 来进行调用。

:::info{title="提示"}
因为外部调用也需要基于用户身份，所以通过 HTTP API 调用时，和普通界面发送的请求一致，都需要提供认证信息，包括 `Authorization` 请求头或 `token` 参数（登录获得的 token），以及 `X-Role` 请求头（用户当前角色名）。
:::

### 无上下文

无上下文的工作流需要针对 workflows 资源进行触发操作：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### 单行记录

类似示例中由按钮触发的工作流，可以这样调用：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

由于该操作是针对单条数据的，所以在对已有数据调用时，需要指定数据行的 ID，替换 URL 中的 `<:id>` 部分。

如果是在针对表单调用（如新增或更新），对新增数据的表单可以不传入 ID，但需要传入提交的数据，作为执行的上下文数据：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

针对更新表单，需要同时传入数据行的 ID，以及更新的数据：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

如果同时传入了 ID 和数据，将首先加载 ID 对应的数据行，再使用传入的数据对象中的属性覆盖原始数据行来得到最终的触发数据上下文。

:::warning{title="注意"}
如果传入了关系数据，则也会进行覆盖，尤其在配置了预加载使用关系数据项时，需要谨慎处理传入数据，以免关系数据被覆盖不符合预期。
:::

另外，URL 参数 `triggerWorkflows` 为工作流的 key，多个工作流用逗号分隔。该 key 可在工作流画布顶部工作流名称处鼠标悬浮后获得：

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

以上调用成功后，将触发对应 `samples` 表的自定义操作事件。

:::info{title="提示"}
通过 HTTP API 调用触发操作后事件时，也需要注意工作流的启用状态，以及数据表配置是否匹配，否则可能不会调用成功，或出现错误。
:::

### 多行记录

与单行记录的调用方式类似，但传入的数据只需要多个主键参数（`filterByTk[]`），且无需传入 data 部分：

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

该调用将触发多行记录模式的自定义操作事件，并且将 id 为 1 和 2 的数据作为触发器上下文中的数据。
