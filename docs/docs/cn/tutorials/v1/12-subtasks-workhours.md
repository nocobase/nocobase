# 第 11 章：子任务与工时计算

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

小伙伴们，终于迎来了新章节！随着业务的扩展，任务越来越多，越来越复杂，我们逐渐意识到，简单的任务管理已经不够用了。现在，我们需要对任务进行更细致的管理，分解成多个层级，帮助大家更高效地完成任务！

### 11.1 规划任务：从全局到局部

我们将会把复杂的任务分解为多个可管理的小任务，通过进度追踪来清晰地了解任务的完成情况，利用多层级管理支持多级子任务的组织。现在，让我们一起开始规划！

---

### 11.2 新建子任务表

#### 11.2.1 设计子任务结构

首先，我们创建一个“子任务表”(Sub Tasks[**树表**](https://docs-cn.nocobase.com/handbook/collection-tree))，并将其设计成树状结构。子任务的属性和主任务相似，比如“任务名称”、“状态”、“责任人”、“进度”等。根据需求，还可以附加评论、文档等相关内容。

为实现子任务与主任务的关联关系，我们建立一个多对一关系，使每个子任务归属于一个主任务。同时，我们设置一个反向关系，便于在主任务中直接查看或管理子任务内容。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> 💡 提示：建议在主任务页面用关联区块进行创建，操作更加便捷！

#### 11.2.2 在任务管理界面显示子任务

在任务管理界面，我们将“任务表”的查看方式设为[**页面**模式](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2)。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

在页面中创建一个新的“子任务管理”标签页，然后添加我们创建的子任务表格，并选用树状结构显示。这样就能在同一页面中管理和查看子任务。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3. 工时对比图：预估整体工时和进度（可选）

接下来，我们趁热打铁，来制作任务的工时细节和工时对比图，以便估算整体工时和任务进度。

#### 11.3.1 添加子任务的时间和工时信息

在子任务表中添加以下字段：

- **开始日期**
- **结束日期**
- **总工时**
- **剩余工时**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

通过这些字段，可以动态计算任务的持续天数和工时。

#### 11.3.2 计算任务持续天数

我们在子任务表中新建一个“天数”[公式字段](https://docs-cn.nocobase.com/handbook/field-formula)，用来计算任务的持续天数。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

公式的计算方式分为

- Math.js

  > 采用 [math.js](https://mathjs.org/) 库，可以计算复杂的数字公式
  >
- Formula.js

  > 采用 [Formula.js](https://formulajs.info/functions/) 库，用来计算常用的公式，如果你熟悉 Excel 公式，这个对你来说一定很轻松！
  >
- 字符串模板

  > 顾名思义，是一种字符拼接的手段，我们平时需要动态的说明、编号之类，可以采用这种拼接
  >

此处我们的实现方式可以使用 `Formula.js` 库，类似 Excel 公式，便于计算常见公式。

此处天数字段的公式如下：

```html
DAYS(结束日期,开始日期)
```

确保使用英文小写格式，以避免出错。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

完毕之后，我们在页面中试一下，天数已经根据我们的开始、结束日期动态变化了！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 每日工时填报：跟踪实际进度（可选）

#### 11.4.1 新建每日工时填报表

我们创建一个每日工时填报表，用于记录每日的任务完成情况。添加以下字段：

- **当日工时** (hours 推荐整数)
- **日期**
- **理想工时** (ideal_hours 推荐整数)
- **所属子任务**：与子任务的[多对一](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o)关系。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 在子任务页面展示每日工时

回到子任务编辑页面，将每日工时表设置为[子表格](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table)形式展示，拖拽布局其他几个字段。这样可以方便地在子任务页面中填写和查看每日工时数据。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 关键计算与联动规则（可选）

为了更加准确地估算任务进度和剩余工时，我们接下来进行一些关键的配置。

#### 11.5.1 设置子任务字段的[必填项](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)

将 **开始日期**、**结束日期** 和 **预估工时**标记为[必填项](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)，确保这些数据齐全，以便于后续的计算。

#### 11.5.2 设置完成比例和剩余工时的[联动规则](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule)

在子任务表中，添加以下计算规则：

- **完成比例**：每日工时的总和 / 预估工时

```html
SUM(【当前表单 / 每日工时 / 当日工时】)  /  【当前表单 / 预估工时】
```

- **剩余工时**：预估工时 - 每日工时的总和

```html
【当前表单 / 预估工时】 - SUM(【当前表单 / 每日工时 / 当日工时】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- 同样的，我们也去每日工时的联动规则中进行理想工时的配置

```html
  【当前表单 / 预估工时】 / 【当前表单 / 任务持续天数】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

这样，我们可以实时计算任务的完成进度和剩余工时。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 制作任务进度比例图表（可选）

#### 11.6.1 创建任务进度[图表](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

新建一个图表区块，用于统计 **每日工时之和**和 **理想工时之和**的变化，并根据日期维度显示任务进度。

限定【关联任务/Id】等于当【前弹窗记录/ID】，确保进度图表能够反映当前任务的真实情况。

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 展示基本信息和进度变化

最后，还记得我们的[Markdown区块](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)吗，我们通过 `markdown` 区块展示任务的基本信息和进度变化。

使用 [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars) 模板渲染进度百分比：

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

其中动态渲染的语法选择 [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars)，可以参考官方文档查看和学习语法细节。

---

### 11.7 总结

恭喜你！现在我们已经完成了子任务的拆分。通过多层级管理、每日工时填报和图表展示，可以更清晰地看到任务的完成进度，帮助团队更高效地工作。感谢你的耐心阅读，继续加油吧，让我们期待[下一章](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking)的精彩！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
