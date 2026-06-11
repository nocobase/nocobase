# 第 8 章：知识库 - 树表

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 欢迎来到新的一章

在本章中，我们将深入学习如何构建一个知识库。这将是一个综合性的模块，帮助我们管理和组织文档、任务和信息。通过设计和创建一个树形结构的文档表，我们将实现对文档的状态、附件和关联任务的高效管理。

### 8.2 数据库设计初探

#### 8.2.1 基础设计与文档表的创建

首先，我们从一个简单的数据库设计开始，为知识库构建一个“文档表”来记录所有文档的信息。文档表包括以下关键字段：

1. **标题 (Title)**：这是文档的名称，使用单行文本格式。
2. **内容 (Content)**：文档的详细内容，使用支持 Markdown 的多行文本格式。
3. **文档状态 (Status)**：用于标记文档的当前状态，包括草稿、已发布、已归档和已删除四个选项。
4. **附件 (Attachment)**：可添加文件和图片等附件，丰富文档内容。
5. **关联任务 (Related Task)**：这是一个多对一关系字段，用于将文档与某个任务关联，方便任务管理中的文档引用。

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

我们也将随着功能扩展，在文档管理系统中逐步添加其他字段。

#### 8.2.2 树形结构的构建与目录管理

> 树结构表（由树表插件提供），树形结构，其中每个数据项都可以有一个或多个子项，而这些子项又可以有自己的子项。

为确保文档的组织和层次，我们的文档表选择[**树结构表**](https://docs-cn.nocobase.com/handbook/collection-tree)，这样便于实现父子关系的分类管理。创建树结构表时，系统自动生成以下字段：

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **父记录 ID**：用于记录当前文档的上级文档。
- **父记录**：多对一字段，帮助我们实现父子关联关系。
- **子记录**：一对多字段，便于查看某个文档下的所有子文档。
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

这几个字段用来维护一张树结构表的目录层级，所以不建议修改。

同时我们需要创建与任务表的关联关系[（多对一）](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o)，带上反向关联，方便我们需要时，在任务关联弹窗内创建文档列表。

### 8.3 创建文档管理页面

#### 8.3.1 新建文档管理菜单

在系统的主菜单中，添加一个新的页面——“文档管理”，并选择合适的图标。然后，为我们的文档表创建一个表格区块。在表格区块中添加基本的增、删、改、查操作，并录入几条测试数据来测试数据表的设计是否正常。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### 练习

1. 尝试在文档管理页面添加一个名为“文档 1”的父文档。
2. 为“文档 1”添加一个子文档，命名为“第一章”。

#### 8.3.2 转换为树表格视图

我知道你可能疑惑，为什么不是目录树结构？

默认情况下，表格区块会显示为普通表格视图，我们来手动开启：

1. 点击表格区块右上角 > 树表格。

   你会发现勾选的一瞬间，树表格下方多了“展开全部”的开关。

   同时刚才创建的 “第一章” 消失了。
2. 点击树表格下方的激活“展开全部”选项。

   此时，我们会看到文档的父子结构显示得更加直观，可以轻松查看并展开所有层级文档。

   我们顺手追加 “添加子记录” 操作。

树表转换成功！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 “添加子记录” 配置

我们绘制一下添加需要的基本内容。注意这个时候如果我们勾选了父记录字段，会发现默认是 “只读（不可编辑）” 状态，因为我们默认是在当前文档下创建的。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

任务数据太多的话，你可能会觉得分配关联任务特别麻烦，我们可以给任务筛选设置一个默认值，就让它等于父记录关联的任务吧。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

默认值可能没有即时生效，我们关闭再点击看看，已经自动填充啦~

### 8.4 配置表单模板与任务关联

#### 8.4.1 创建表格和表单[模板](https://docs-cn.nocobase.com/handbook/block-template)

为了便于后续管理，我们将文档的表格、创建和编辑表单[保存为模板](https://docs-cn.nocobase.com/handbook/block-template)，以便在其他页面复用。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 文档表格区块复制展示

在任务表的查看弹窗中，添加一个新的[标签页](https://docs-cn.nocobase.com/manual/ui/pages)——“文档”。在该标签页中，添加表单区块 > 其他记录 > 文档表 >“复制模板”> 点击将我们之前创建的文档表单模板引入。（切记选择 [**复制模板**](https://docs-cn.nocobase.com/handbook/block-template)。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

这种方式便于所有文档列表的创建。

#### 8.4.3 任务关联改造

由于我们是复制的外部表格模板，并没有和任务表关联。你会发现展示出了全部的文档数据，肯定不是我们预期的效果。

这种情况比较常见，如果我们没有创建对应关系字段，又需要展示关联数据的话，就需要对二者做手动关联。（切记我们采用[**复制模板**](https://docs-cn.nocobase.com/handbook/block-template)，不要选择[引用模板](https://docs-cn.nocobase.com/handbook/block-template)，不然我们做的所有更改会同步到其他表格区块！）

- 数据展示关联

我们点击表格区块右上角，[“设置数据范围”](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope)为：

【任务/ID】= 【当前弹窗记录/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

成功，目前表格内留下来的文档都会是我们任务所绑定的。

- 添加表单区块关联。

进入添加区块：

对于关联任务表字段，设置[默认值](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) >【上级弹窗记录】。

上级弹窗 属于我们所在任务数据的“查看”操作中，会直接绑定对应的任务数据。

我们设置[只读(阅读模式)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern)，代表在当前弹窗内，只能绑定当前任务。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

搞定！现在新增、展示都会是所在任务关联的文档啦。

细心的你可以补充一下 “编辑”、“添加子任务”里面的关联筛选。

为了让树结构更加清晰明显，操作列更整齐美观点，我们把标题挪至第一列。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 文档管理中的筛选与搜索

#### 8.5.1 添加[筛选区块](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

我们顺便给文档表增加筛选功能吧。

- 在文档管理页面添加一个[筛选区块](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)。
- 选择筛选中的表单，拖到最上面。
- 勾选标题、状态、任务表字段等作为筛选条件。
- 添加“筛选”和“重置”操作。

这个表单就是我们的搜索框，方便在输入关键词后快速查找相关文档。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [连接数据区块](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

这个时候你会发现点击之后没效果，我们还需要最后一步：具备搜索功能的区块之间互相连接。

- 我们点击区块右上角配置 > [连接数据区块](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)。

  ```
  里面提供了可被连接的区块。

  因为我们创建的是文档表单，所以它会搜索所有关联文档表的数据区块（本页只有一个），并作为选项呈现出来。

  也不用担心分不清楚，我们鼠标挪到上面时，屏幕视角也会自动集中到对应区块上。
  ```
- 点击开启需要被连接的区块，测试搜索。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

通过点击筛选区块的右上角配置按钮，将筛选区块与文档表的主数据区块连接。这样，每次在筛选区块中设置条件后，表格区块会根据条件自动更新结果。

### 8.6 知识库[权限设置](https://docs-cn.nocobase.com/handbook/acl)

为确保文档安全和管理规范，可以根据角色为文档库分配[权限](https://docs-cn.nocobase.com/handbook/acl)。不同角色的用户可以根据权限配置，对文档进行查看、编辑或删除操作。

不过我们接下来会改造文档表，加上新闻、任务公告的功能，权限可以放开一点哦。

### 8.7 小结与下一步

在本章中，我们创建了一个基本的知识库，包括文档表、[树形结构](https://docs-cn.nocobase.com/handbook/collection-tree)和与任务的关联展示。通过为文档添加筛选区块和模板复用，我们实现了高效的文档管理。

接下来，我们将进入[下一章](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1)，学习如何搭建一个包含[数据分析图表](https://docs-cn.nocobase.com/handbook/data-visualization)，重要信息展示的个人仪表盘！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
