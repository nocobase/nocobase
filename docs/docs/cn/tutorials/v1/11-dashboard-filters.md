# 第 10 章：看板筛选与条件

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

在本章中，我们将带您一步步完成任务仪表盘的下一部分，有任何疑问记得随时来论坛咨询。

从复习上章内容开始，让我们一起展开这段探索之旅吧！

### 10.1 揭晓上一章节答案

#### 10.1.1 状态与链接

首先，我们要为不同状态的数据添加链接跳转，以便于快速导航。以下是每种状态的链接结构：

（假设我们的链接是 `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x` ）

##### 挑战谜底


| 状态<br/>   | 链接<br/>                                            |
| ----------- | ---------------------------------------------------- |
| 未开始<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| 进行中<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| 待审核<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| 已完成<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| 已取消<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| 已归档<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 添加负责人多选功能

1. **新建[自定义字段](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)**：我们需要创建一个“负责人”字段，类型为多选，并填写成员的昵称（或用户名），方便在任务分配时快速选择对应的人员。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **在报表配置中**：设置“负责人/昵称 包含 当前筛选/负责人”作为筛选条件。这样，您可以快速查找到当前负责人相关的任务。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

任意筛选几次，以确认该功能正常工作。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 使仪表盘和用户关联

我们可以根据不同用户展示不同的内容，操作方法如下：

1. **设置“负责人”字段的默认值为“当前用户/昵称”**：这样可以让系统自动展示当前用户相关的任务，提升操作效率。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **刷新页面后**：仪表盘会自动加载与当前登录用户关联的数据。（记得给需要的图表添加用户筛选条件）

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 重构任务筛选

一些朋友可能发现了一个不合理的设计：

直接在表格区块“设置数据范围”跳转后，我们的任务就会被提前限制在对应状态范围，这个时候我们再筛选其他状态，发现数据是空的！

怎么办呢？我们去除数据筛选，来换一种筛选方式吧！

1. **去掉数据筛选方式**：避免状态数据被锁定在当前范围，灵活调整筛选需求。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **配置表单筛选区块默认值。**

还记得我们的[筛选区块](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)吗？

新建一个用于任务表筛选的表单区块，配置 **状态** 和 你需要的其他字段，我们用来填充 url 带来的变量。（记得连接需要被筛选的任务表区块）

- 设置状态字段默认值为 `URL search params/task_status`。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **测试新筛选功能**：可以随时更换状态筛选条件，自由切换。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **可选**：如果您希望每个用户专注于自己任务，还可以将“负责人”字段默认值设置为“当前用户”。

---

### 10.4 新闻、通知、信息聚焦

来改造下文档库吧！把我们需要的信息，展示到仪表盘~

在长期文档管理中，我们会碰到越来越多的资料和文档，这个时候我们会逐渐出现多种需求：

- News：聚焦项目动态、成就、里程碑
- 临时公告/提醒

#### 10.4.1 热点信息（News）

1. **添加“热点信息”字段**：在文档表中新增“热点信息”勾选字段，以标记该文档是否为重要新闻。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **追加和选择文档信息**：我们随意挑选一篇文章，在编辑表单中添加“热点信息”字段，并勾选。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **新建“列表”区块**：回到在仪表盘中，新建[“列表”区块](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) > 选择文档表。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

拖拽到右侧，展示“创建日期”和“标题”，调整字段宽度，并且关闭“显示标题”

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **展示热点信息**：

为了体现实时性，我们可以同时展示时间。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

按照创建日期倒序排列，展示最新的热点新闻。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

一个简单的热点信息就做好了，成员随时可以关注整个项目的重要进展！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 公告通知

接下来是一个简单的公开通知功能，相信大家在我们的在线 Demo 中已经见过不少次他的身影了。对于这种临时性的通知，我们不希望长期显示，也不需要记录项目进展。只是用来提醒/通知一些临时性的事情。

1. **新建 [Markdown 区块](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)**：选择仪表盘的任意区域，使用 Markdown 语法添加公告内容。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

关于 Markdown 的实际使用，可以参考我们的官方 Demo、官方文档，或者[“轻量化文档”教程](https://www.nocobase.com/cn/tutorials)。

做为简单范例，根据HTML语言写的“一个华丽的公告”来给大家演示一下 [Markdown 区块](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)的强大功能。

- 示例代码：

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">重要公告</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">亲爱的同事们：</p>
    <p style="font-size: 1.2em; line-height: 1.6;">为了更好地提高工作效率，我们将于 <span style="color: red; font-weight: bold; font-size: 1.5em;">11月10日</span> 开展一次全员培训。</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">谢谢大家的配合！</p>
    <p style="font-size: 1.2em; line-height: 1.6;">祝好，</p>
    <p style="font-size: 1.2em; line-height: 1.6;">管理团队</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 小结

通过以上的配置步骤，我们成功创建了一个个性化的仪表盘，使团队成员能够更高效地管理任务、关注项目进展，并及时接收公告和通知。

从状态筛选、负责人设置到热点信息展示，旨在优化用户体验并提升系统的便捷性和灵活性。

至此，我们的个性化仪表盘已经准备就绪，欢迎大家动手体验，一起来结合实际需求，深入改造，让我们步入[下一章节](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
