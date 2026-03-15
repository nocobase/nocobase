# 第 5 章：标签页与动态区块

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

小伙伴们，欢迎来到第五章！这一章内容非常精彩，我们将为任务管理页面增添更多的功能，支持各种不同的视图方式。相信你已经期待已久了，对吧？别急，我会一步步带你去实现，像往常一样，咱们一起轻松搞定！

### 5.1 标签页容器，容纳各种区块

我们已经创建了任务管理页面，但为了让系统更加直观，我们希望任务可以在页面内切换不同的展示模式，比如 [**表格**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)、[**看板**](https://docs-cn.nocobase.com/handbook/block-kanban)、[**日历**](https://docs-cn.nocobase.com/handbook/calendar)，甚至 [**甘特图** ](https://docs-cn.nocobase.com/handbook/block-gantt)。NocoBase 的标签页功能让我们可以在同一页面中切换不同的区块排布，别担心，我们慢慢操作。

- 创建标签页
  首先，咱们来创建标签页。

1. **新增子标签页**：

   - 打开你之前的任务管理页面，在页面内创建一个子标签页。第一个标签页我们可以命名为 **“表格视图”**，这个视图里展示我们已经设置好的任务列表区块。
2. **再创建一个新标签页**：

   - 接下来，咱们再创建一个标签页，叫 **“看板视图”**。我们将在这里创建任务的看板区块。
     ![创建标签页](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

准备好了吗？我们进入各种区块的创建吧！

> **区块简介：** 区块是数据和内容的载体，将数据以合适的方式呈现在网站上，可以放置于页面（Page）、对话框（Modal）或抽屉（Drawer）里，多个区块可以自由拖拽排列，在区块中对数据的不断操作可以实现各种配置和展示。
> 通过在NocoBase中使用区块功能，在此次学习案例中应用，能够更加快捷地实现和管理系统的页面和功能的构建，同时区块可以设置模板方便复制和引用，极大地减少了创建区块的工作量。

### 5.2 看板区块：任务状态一目了然

[**看板**](https://docs-cn.nocobase.com/handbook/block-kanban)是任务管理系统里非常重要的一个功能，它能让你通过拖拽方式直观地管理任务状态。比如，你可以按照任务的状态进行分组，直接看到每个任务处在哪个阶段。

#### 5.2.1 看板区块的创建

1. **开始新建看板区块**：

- 在 **看板视图** 标签页中，点击“创建区块”，选择任务表，接下来会出现一个选项，询问你需要按照哪个字段对任务进行分组。

2. **选择分组字段**：

- 我们选择之前创建的 **状态** 字段，按照任务状态进行分组。（注意，分组字段只能是[“下拉菜单（单选）”](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select)或[“单选框”](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group)类型）

3. **添加排序字段**：

- 看板内的卡片可以通过排序字段来调整顺序。为了实现这一功能，我们需要新建一个排序字段。点击“添加字段”，创建一个名为 **状态排序（status_sort）** 的字段。
- 这个字段是为了定位拖拽看板时，卡片的上下顺序，就像坐标一样，左右分组是不同状态，上下位置则是排序的值。后期我们拖拽卡片后，可以从表单中观察排序值的变化。
  ![创建看板区块](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 勾选字段与操作

- 最后，记得在看板区块中勾选需要展示的字段，比如任务名称、任务状态等，确保卡片的信息丰富完整。

![看板字段展示](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 使用模板：复制与引用

新建看板区块后，我们需要创建一个 **新增表单**。这里，NocoBase 提供了一个非常方便的功能——你可以 [**复制** 或 **引用** ](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB)之前的表单模板，这样我们就不用每次都重新配置。

#### 5.3.1 **保存表单为模板**

- 在你之前的新增表单中，鼠标移到表单配置上，点击“保存为模板”。你可以为模板取个名字，比如 “任务表_表单 新增”。

![保存表单为模板](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **复制或引用模板**

在看板视图中新建表单时，你会看到两个选项：“**复制模板**” 和 “**引用模板**”。你可能会问：它们有什么区别呢？

- [**复制模板**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB)：相当于复制了一份新的表单副本，你可以独立修改它，不会影响原来的表单。
- [**引用模板**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB)：则是将原表单直接“借用”过来，任何修改都会同步到其他引用这个模板的地方。比如你修改了字段顺序，所有引用此模板的表单都会跟着变化。

![复制与引用模板](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

你可以根据自己的需求选择复制还是引用模板。一般来说，**引用模板** 更加方便，因为你只需修改一次，所有地方都会同步生效，非常省时省力。

### 5.4 日历区块：任务进度一目了然

接下来，让我们来创建一个 [**日历区块**](https://docs-cn.nocobase.com/handbook/calendar)，帮助你更好地管理任务的时间安排。

#### 5.4.1 创建日历视图

##### 5.4.1.1 **新建日期字段**：

日历视图需要知道任务的 **开始日期** 和 **结束日期**，因此我们需要在任务表中新增两个字段：

- **开始日期（start_date）**：标记任务的开始时间。
- **结束日期（end_date）**：标记任务的结束时间。

![新增日期字段](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 新建日历区块：

回到日历视图，创建一个日历区块，选择任务表，并使用刚刚创建的 **开始日期** 和 **结束日期** 字段。这样，任务将在日历上显示为一个持续时间段，直观展示任务的进展。

![日历视图搭建](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 体验日历操作：

在日历上，你可以随意拖拽任务，点击并编辑任务的详细信息（别忘了复制或引用模板）。

![日历操作](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 甘特图区块：管理任务进度的神器

最后一个区块是 [**甘特图区块**](https://docs-cn.nocobase.com/handbook/block-gantt)，它是项目管理中常用的工具，帮助你追踪任务的进度和依赖关系。

#### 5.5.1 创建“甘特图视图”标签页

#### 5.5.2 **新增“完成比例”字段**：

为了让甘特图更好地展示任务进度，我们需要新增一个字段，叫 **完成比例（complete_percent）**。这个字段用来记录任务的完成进度，默认值为 0%。

![新增完成比例字段](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **新建甘特图区块**：

在甘特图视图里，创建一个甘特图区块，选择任务表，并配置好相关的开始日期、结束日期和完成比例字段。

![甘特图视图搭建](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **体验甘特图拖拽功能**：

在甘特图中，你可以通过拖拽任务来调整它的进度和时间，任务的开始日期、结束日期以及完成比例都会跟着更新。

![甘特图拖拽](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### 小结

太棒了！你现在已经掌握了如何在 NocoBase 中使用多种区块来呈现任务数据，包括[ **看板区块**](https://docs-cn.nocobase.com/handbook/block-kanban)、[**日历区块**](https://docs-cn.nocobase.com/handbook/calendar) 和 [**甘特图区块**](https://docs-cn.nocobase.com/handbook/block-gantt)。这些区块不仅让任务管理更加直观，还为我们带来了极大的灵活性。

但这只是开始！想象一下，在一个团队里，不同的成员可能拥有不同的职责，如何确保每个人都能无缝地协同工作？如何在保证数据安全的同时，让每个人只看到和操作与自己相关的内容呢？

准备好了吗？我们这就进入下一章： [第六章：合作伙伴——协作无间，灵活掌控](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions)。

看看如何通过简单的操作，让我们的团队协作更上一层楼！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
