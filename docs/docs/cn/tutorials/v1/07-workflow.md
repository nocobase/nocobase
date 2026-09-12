# 第 7 章：工作流

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

恭喜你走到了这最后一章！我们将在这一章中介绍和简单探索 **NocoBase** 的强大工作流功能。通过这个功能，你可以为系统中的任务自动化操作，节省时间并提升效率。

### 上节挑战答案

但在开始之前，先回顾一下上节的挑战吧！我们成功地为“伙伴”角色配置了 **评论权限**，如下：

1. **添加权限**：允许用户发布评论。
2. **查看权限**：允许用户查看所有评论。
3. **编辑权限**：用户仅能编辑自己发布的评论。
4. **删除权限**：用户仅能删除自己的评论。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

这样配置后，Tom 不仅能够自由发布评论，还可以查看其他成员的评论，同时确保只有自己能编辑和删除自己的发言。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

现在，让我们来实现一个自动化功能：**每当任务负责人被更换时，系统会自动发布一条通知给对应责任人，提示新负责人接手任务**。

> **工作流：** 工作流插件是一种强大的自动化工具，常见于业务流程管理（BPM）领域。
>
> 它用于设计和编排基于数据模型的业务流程，借助触发条件和流程节点的配置，实现流程的自动化流转。这类插件尤其适合自动处理重复性、数据驱动的任务。

### 7.1 工作流创建

#### 7.1.1 后台页面创建工作流

首先，切换到 **Root 角色**，这是系统管理员的角色，拥有所有权限。接着，进入 [**工作流模块**](https://docs-cn.nocobase.com/handbook/workflow)。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

点击右上角的 **“添加”** 按钮，新建一个工作流，填写基本信息：

- **名称**：更换责任人时生成系统通知。
- **触发方式**：选择“数据表事件”。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 触发方式选择说明：

1. [**数据表事件**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection)：当数据表中的信息发生变化时触发（增加、修改、删除）。这种方式非常适合跟踪任务字段的变动，例如更换负责人。
2. [**定时任务**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule)：在特定时间自动触发，与日程相关的自动化操作更为合适。
3. [**操作后事件**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action)：绑定到操作按钮，当用户执行某一操作后触发。例如，点击保存按钮后触发任务。

我们在以后的使用中，还会发现其他触发方式，比如”操作前事件“、”自定义操作事件“、”审批“......都可以通过我们对应的插件来解锁。

在这个场景下，我们使用 [**数据表事件**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) 来跟踪 “任务表” 中“负责人”的变化。提交工作流后，点击 **配置**，进入工作流设置页面。

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 工作流节点配置

#### 7.2.1 配置触发条件

话不多说，开始自动通知流程的构建吧~

我们先配置第一个节点，设置条件让工作流在特定情况下自动启动。

- **数据表**：选择 “任务表”。（由哪张数据表来触发本工作流，对应数据也会同步读取到工作流中。我们自然是希望 ”任务表“ 变动时，才开始当前工作流。）
- **触发时机**：选择 “新增或更新数据后”。
- **触发字段**：选择 “负责人”。
- **触发条件**：选择“负责人 ID 存在”，确保只有当任务被分配了负责人时，才会发送系统通知。
- **预加载数据**：选择“负责人”，以便在后续流程中使用其信息。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 开启“站内信”渠道

下一步，我们将创建一个发送通知的节点。

在此之前，我们需要先创建一个用于发送通知的[“站内信”渠道](https://docs-cn.nocobase.com/handbook/notification-in-app-message)。

- 回到插件管理界面，选择“通知管理”，新建任务通知（task_message）
- 渠道创建完毕，我们回到工作流中，新建 “通知” 节点
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- 节点配置
  **渠道：** 选择“任务通知”
  **接收人：** 选择 “触发器变量/触发数据/负责人/ID”，这样就能定位到变更后的负责人啦。
  **消息标题：** 我们填写 “责任人更换提醒”
  **消息内容：** 填写“您已被指派为新的责任人”

完成后，点击右上角开关，启用此工作流。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

配置好啦~

#### 7.2.3 测试通知

激动人心的时刻到了，我们回到页面，任意点击一条任务编辑，更改负责人，直接点击提交，系统已经发送通知啦！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

工作流的设置流程就是这样，不过我们还有工作要做：

我们生成的通知需要动态插入任务信息，不然大家都不清楚哪个工作移交给了自己。

### 7.3 工作流完善

#### 7.3.1 版本管理

回到工作流配置，这个时候你会发现工作流界面已经变成灰色，无法编辑。

别担心，点击右上角省略号 > [**复制到新版本**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions)，我们就来到了新版本的配置页面。当然，之前的版本也会保留，点击 **版本** 按钮，随时可以切换到历史版本（注意：已执行过的工作流版本无法再更改！）。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 优化通知内容

现在，我们让通知内容变得更个性化，添加上移交信息的详细说明。

- **编辑通知节点。**

更改消息内容为：  “任务《【任务名称】》，责任人已更换为：【责任人昵称】”

- 我们点击右边的变量，填充任务名称和责任人。
- 然后点击右上角，启用这个版本。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

启用更新后的工作流版本，再次测试时，系统通知展示出了新任务的名称。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### 小结

太棒了！你已经成功创建了一个基于任务负责人变动的自动化工作流。这一功能不仅节省了手动操作的时间，还提升了团队协作的效率。到这里，我们的任务管理系统已经具备了强大的功能。

---

### 总结与展望

到此为止，你已经从零开始完成了一个完整的任务管理系统——涵盖了任务创建、评论功能、角色权限设置，还有工作流和系统通知。

NocoBase 的灵活性和扩展性即将为你提供无限的可能，未来，你可以继续深入探索更多插件、定制功能，或者创建更加复杂的业务逻辑。相信通过这些学习，你已经掌握了使用 NocoBase 的基本用法和核心概念。

让我们期待你的下一个创意！如果有任何问题，随时查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 讨论。

继续探索，创造无限可能！
