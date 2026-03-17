# 第 3 章：任务数据管理

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

现在我们已经梳理了任务管理系统的需求，是时候开始实际操作了！回想一下，我们的任务管理系统需要能够 **[新建](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new)、[编辑](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit)、[删除](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** 任务，还要 **查询任务列表**，而这些功能都可以通过 NocoBase 的页面、区块和操作来实现。

> 访问官方文档，查看[菜单](https://docs-cn.nocobase.com/handbook/ui/menus)和[页面](https://docs-cn.nocobase.com/handbook/ui/pages)详细定义。

### 3.1 如何开始呢？

你可能还记得，我们之前已经介绍过如何新建页面和展示用户列表。这些页面就像画布一样，可以容纳不同类型的区块，你可以自由地排列它们的顺序和大小。为了方便复习一下操作步骤：

1. [**新建页面**](https://docs-cn.nocobase.com/handbook/ui/pages)：简单点击几下就能完成页面创建。
   ![新建页面](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **新建[表格区块](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**：选好表格区块后，你可以展示不同的数据。
   ![新建表格区块](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

看起来非常简单，对吧？
不过，当你打开“数据列表”时，你会发现默认的选项里只有“用户”和“角色”两张表。
那任务表在哪里呢？别担心，答案就在 NocoBase 的 [**数据源**](https://docs-cn.nocobase.com/handbook/data-source-manager) 功能里。

> **数据源简介：** 数据源可以是数据库、API或其他类型的数据存储，支持连接各种关系型数据库，如MySQL、PostgreSQL、SQLite、MariaDB数据库。
> 在NocoBase中，已经提供了**数据源管理插件**，用于管理数据源和数据表。但是数据源管理插件只是提供了数据源管理界面，并不提供接入数据源的能力，它需要和各种**数据源插件**搭配使用。

### 3.2 数据源：你的数据表仓库

![](https://static-docs.nocobase.com/20241009144356.png)

在 NocoBase 中，所有的数据表都存储在 [**数据源**](https://docs-cn.nocobase.com/handbook/data-source-manager) 中，数据源就像一本本书一样，里面写满了每张数据表的设计和结构。接下来，一起写下属于我们的新的一页： **任务表**。

> [!NOTE] Note
> 如果你想查阅数据源和数据表的更多能力，参考 [数据源管理](https://docs-cn.nocobase.com/handbook/data-source-manager) 和 [数据表概述](https://docs-cn.nocobase.com/handbook/data-modeling/collection)

- **进入数据源设置**：
  - 点击右上角的 **设置** > **数据源** > **主数据源配置**。
  - 你会看到 NocoBase 主数据源内所有已存在的表，通常默认只有“用户”和“角色”两张表。
    ![数据源配置](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

现在，是时候创建第三张表，也就是我们的 **任务表**了。这将是我们首次在 NocoBase 中创建数据表，真是个激动人心的时刻！我们只需要按照之前的设计，创建一个简单的任务表，包含以下字段：

```
任务表（Tasks）：
        任务名称(task_name) 单行文本
        任务描述(task_description) 多行文本
```

### 3.3 创建任务表

1. **新建任务表**：

   - 点击“创建数据表” > 选择 **普通数据表** > 填写 **数据表名称**（如“任务表”）和 **数据表标识**（如“tasks”）。
   - **数据表标识** 是表的唯一 ID，建议使用英文、数字或下划线命名，便于后续查找和维护。
   - 提交创建。
     ![创建任务表](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **默认字段说明**：
   NocoBase 会为每张普通数据表生成预设的字段：

   - **ID**：每条记录的唯一标识符。
   - **创建日期**：自动记录任务的创建时间。
   - **创建人**：自动记录任务的创建者。
   - **最后修改日期** 和 **最后修改人**：记录每次任务被修改的时间和用户。

这些默认字段正是我们所需要的，省去了很多手动添加的麻烦。

3. **创建自定义字段**：
   - **任务名称**：点击“添加字段” > 选择 **单行文本** > 设置字段名称为“任务名称”，字段标识为 “task_name”。
     ![创建任务名称字段](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **任务描述**：再创建一个 **多行文本** 字段，字段标识为 “task_description”。
     ![创建任务描述字段](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

恭喜你！现在我们的 **任务表** 已经定义好了，你已经成功创建了属于自己的任务数据结构。为你点个赞！

### 3.4 创建任务管理页面

现在我们已经有了任务表，接下来就是用一个合适的区块，把它呈现在页面容器上。我们将新建一个 **任务管理页面**，并在页面中添加一个展示任务数据的表格区块。

1. **新建任务管理页面**：

   - 点击“新建页面”，命名为“任务管理”。
   - 创建一个任务区块，展示任务表数据。
     ![创建任务区块](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **添加数据**：

   - “咦，为什么没有数据？”，别担心，我们现在就来着手添加！
   - 点击页面右上角的“配置操作”，点击 **“添加”** 操作，你会发现跳出来了一个空的弹窗容器。
     [添加](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new)、[编辑](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) 操作默认会绑定弹窗。
   - 接下来新的区块（表单）登场了：创建弹窗区块 > 选择 **当前数据表**。
   - 展示任务名称和描述字段，配置提交操作，提交表单就搞定了！
     ![配置操作](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **录入数据**：

   - 录入一条测试数据，点击提交，成功啦！任务数据已经添加进来了。
     ![提交数据](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

激动人心的时刻！你成功录入了第一个任务数据，是不是很简单？

### 3.5 任务查询与筛选 —— 快速定位任务

如果任务越来越多时，如何快速找到你想要的任务呢？这时候，[**筛选操作**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter)就派上用场了。在 NocoBase 中，你可以轻松通过筛选操作的条件配合来查找特定任务。

#### 3.5.1 启用筛选操作

首先，我们需要开启筛选操作：

- **鼠标移动到“配置操作”**，然后点击**筛选开关**，启用筛选。
  ![启用筛选](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 使用筛选条件

启用筛选操作后，你会看到筛选按钮出现在页面上。现在可以通过**任务名称**来测试一下筛选操作是否生效：

- 在筛选操作面板中选择 任务名称，输入你想要查询的内容。
- 点击“提交”，看看任务列表是否正确显示了筛选后的结果。
  ![启用筛选](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 关闭筛选操作

如果你不再需要筛选操作，一般对于开关类型的操作，只需轻点一下即可取消：

- **重置筛选条件**：确保没有任何筛选条件正在生效，点击“重置”按钮。
- 再次点击 **“筛选”开关**，筛选就会从页面中隐藏了。
  ![关闭筛选](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

就这么简单！筛选操作将为你管理大量任务提供极大的便利，随着我们一步步熟悉系统，还会有其他多样灵活的查询方式为你揭晓。（你可以查阅 [表单筛选区块](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) 和 [折叠面板筛选区块](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse) ）

继续保持这份热情，让我们继续前进！

### 3.6 任务的编辑与删除

除了添加、查询任务，我们还需要能够 [**编辑**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) 和 [**删除**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) 任务。你已经熟悉了添加区块、字段、操作的流程，这下就很简单了：

1. **编辑任务**：

   - 在任务列表的配置中添加 **编辑** 操作，点击编辑 > 添加表单（编辑）区块 > 选择需要编辑的字段。
2. **删除任务**：

   - 同样地，在操作列的配置中打开 **删除** 操作开关，删除按钮出现后，点击删除 > 确认，任务会从列表中移除。
     ![编辑任务](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

至此，任务列表的 **增删改查** 操作已经全部实现了。

太棒了！你成功完成了这一步！

### 挑战任务

在你对 NocoBase 的操作越来越熟练之后，来试试一个小挑战：我们需要标记任务的状态，并让它支持附件上传，该怎么做呢？

提示：

- 为我们的任务表添加：
  1. ”**状态（status）** ”字段，作为下拉单选，包含以下选项：**未开始、进行中、待审核、已完成、已取消、已归档**。
  2. “**附件（attachment）**” 字段。
- 在 任务表格 、“添加”和“编辑”表单 区块中，展示 “状态”、”附件“ 字段。

你有思路了吗？别急，[下一章（第四章：任务与评论插件 —— 如虎添翼，顺利掌握）](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use)将揭晓答案，我们拭目以待！

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
