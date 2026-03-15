# 第 9 章：任务看板与图表

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

亲爱的小伙伴们，终于进入我们期待已久的可视化章节了！在这一章里，我们将探讨如何在繁杂的信息中快速聚焦到我们真正需要的内容。作为管理者，咱们可不能在复杂的任务中迷失方向哦！让我们一起来，轻松搞定任务统计与信息展示吧。

### 9.1 聚焦关键信息

我们希望能轻松一览团队任务情况，找到自己负责或关心的任务，而不是在一堆繁琐的信息中徘徊。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

首先，来看看如何创建一个团队任务统计的[图表](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)吧。

#### 9.1.1 创建[图表数据区块](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

新建一个页面（比如个人面板）：

1. 新建图表数据区块。（注意在这个大的区块中，我们可以建立很多的数据图表）
2. 图表区块中，选择我们的目标：任务表。一起进入图表配置。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 配置统计状态

如果我们要统计不同状态的任务数量，该怎么做呢？首先，我们得处理数据：

- 度量: 选择一个唯一字段，比如 ID 字段来计数。
- 维度: 使用状态进行分组。

接下来，进行图表配置：

1. 选择[柱状图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column)或[条形图](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar)。
2. X 轴选择状态，Y 轴选择 ID。记得选择分类字段“状态”哦！（不选的话，图表的颜色就无法区分，可能会不太好辨认。）

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 多维度统计：每个人的任务数量

如果我们想统计每个人每个状态的数量，那就来个双维度的统计吧！我们可以加上“负责人/昵称”的维度。

1. 点击左上方的“执行查询”。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. 你会发现图表可能有点奇怪，好像不是想要的效果。没关系，选择“分组”就能展开不同负责人的对比。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. 同时，如果想要堆叠展示整体数量，可以选择“堆叠”。这样，咱们就能看到每个人的任务数占比 + 整体任务情况啦！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 数据筛选与动态展示

#### 9.2.1 数据筛选配置

当然，咱们还可以进一步去除“已取消”和“已归档”的数据，只需在左侧过滤条件中去掉这两个选项，相信你对这些条件判断已经非常熟悉了！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

我们筛选好之后，点击确定，退出配置，页面中我们第一个图表已经建好啦。

#### 9.2.2 [复制图表](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

如果你想同时展示 “分组” 和 “堆叠” 图，又不想重新配置怎么办？

- 我们在第一个图表 block 右上角，点击复制
- 滑动滚轮往下，第二个图表已经出现了，将它拖拽到右侧，去掉“堆叠”配置，修改为“分组”。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 动态[筛选](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)

如果我们想动态[筛选](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter)不同条件下的任务数据，可以做到吗？

当然！我们在图表数据区块下方，打开“过滤”，上方已经出现了筛选框，我们展示想要的字段，并且设置一下字段的筛选条件。(比如将日期字段修改为“介于”)

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 创建自定义筛选字段

如果我们还想在特殊情况下，包含“已取消”和“已归档”的数据怎么办，并且要支持动态筛选、设置筛选默认条件？

一起来创建一个[自定义筛选字段](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)！

> 自定义筛选字段：您可以选择关联数据表中的字段或自定义字段（仅在图表可用）。
>
> 支持编辑字段标题、描述、筛选操作符，并设置默认值（如当前用户或日期），让筛选更贴合您的实际需求。

1. 标题填写“状态”。
2. 来源字段留空。
3. 组件选择“复选框”。
4. 选项按照新建数据库时的状态属性值填写（注意这里的属性顺序为 选项标签 - 选项值）。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

创建成功，点击“设置默认值”，选择我们需要的选项

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

设置完默认值后，返回到图表配置，将过滤条件改为“状态 - 包含任何一个 - 当前筛选/状态”，然后确认即可！（两个图表都要改哦）

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

搞定，我们筛选测试一下，数据已经完美呈现了。

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 动态链接与任务筛选

接下来，我们要实现一个非常实用的功能：通过点击统计数字，直接跳转到对应任务的筛选。为此，我们先添加各状态数量统计图，将它们放在最上面。

#### 9.3.1 以”未开始“为例，创建[统计图表](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. 设置度量为：ID 计数
2. 设置过滤条件： 状态 等于 “未开始”
3. 容器名称填写“未开始”，类型选择“统计”，下面图表名称置空。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

未开始的统计已经成功展示啦。我们按状态复制五份，并且拖拽到最上方

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 配置链接筛选

1. 回到任务管理表格区块所在页面，查看浏览器上方的链接格式（通常类似于 `http://xxxxxxxxx/admin/0z9e0um1vcn`）。
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   假设这里的 `xxxxxxxxx` 是你的网站域名，`/admin/0z9e0um1vcn` 是路径。(我们寻找最后一个/admin 即可)
2. 复制链接的一部分

   - 我们需要进行链接跳转。为了做到这一点，首先要从链接中提取一个特定的部分。
   - 从 `admin/` 开始（注意不要包括 `admin/` 这个字符本身），一直复制到链接的末尾。比如，在这个例子中，我们需要复制的部分是：`0z9e0um1vcn`

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

我们鼠标移动到 “未开始” ，会发现鼠标已经变成了手指形状，我们点击一下，跳转成功。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. 配置图表的链接
   现在，让我们为链接添加一个筛选参数。还记得任务状态的数据库标识吗？我们将需要在链接的末尾添加上这个参数，这样做可以进一步筛选任务。
   - 在链接的末尾加上 `?task_status=Not started`，这样你的链接就会变成：`0z9e0um1vcn?task_status=Not started`
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> 理解 URL 传参的格式：
> 在链接中添加参数时，有一些格式规则需要遵循：
>
> - **问号（?）**：参数的开始。
> - **参数名和参数值**：格式为 `参数名=参数值`。
> - **多个参数**：如果需要添加多个参数，可以用 `&` 符号将它们连接起来，比如：
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   在这个例子中，`user` 是另一个参数名，`123` 是其对应的值。

4. 回到页面，点击跳转，成功，URL 后面已经带上了我们想要的参数

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [关联 URL 筛选条件](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

表格为什么还没有跟着变呢？别担心，一起来完成最后一步！

- 回到表格区块配置中，点击“设置数据范围”。
- 选择 “状态” 等于 “URL 查询参数/status”。

点击确认，筛选成功！

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4[ 数据可视化](https://docs-cn.nocobase.com/handbook/data-visualization)：炫酷图表

> 数据可视化：[ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts)（商业插件，付费额）
> ECharts提供了更多、更为个性化的配置项，如“[折线图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line)（多维度）”、“[雷达图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)”、“[词云](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)”...

如果你想获取更多图表配置，可以开启“数据可视化：ECharts”区块哦！

#### 9.4.1 快速配置一个炫酷的[雷达图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

如果发现数据遮挡，记得调整尺寸或半径，确保所有信息都能清楚展示！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

配置好之后拖拽一下展示方式，完成！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 更多的图表容器

这里还有更多图表等你探索。

##### [词云图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [漏斗图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [多种指标（双轴图、Echarts 折线图）](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

对于双轴图你可以添加更多指标

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [对比条形图](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 小挑战

在我们结束这一章之前，发布一个小挑战哦：

1. 将剩下的**进行中、待审核、已完成、已取消、已归档**的 URL 传参都加上，让它们能够顺利跳转筛选。
2. 配置“负责人”多选字段，就像我们完成的 “状态” 多选一样，默认值设置为当前用户昵称。

[下一章](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2)我们将继续展开仪表盘的下一篇，期待与你们的下一次见面！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
