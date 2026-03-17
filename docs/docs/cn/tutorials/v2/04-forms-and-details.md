# 第 4 章：表单与详情 — 录入、展示、一步到位

上一章我们搭好了工单列表，并用一个简易表单录入了测试数据。这一章我们来**完善表单体验**——优化[表单区块](/interface-builder/blocks/data-blocks/form)的字段布局、添加[详情区块](/interface-builder/blocks/data-blocks/details)、配置[联动规则](/interface-builder/linkage-rules)，还能用[变更历史](/collection-templates/audit-log)追踪工单的每一次修改。

## 4.1 完善新建工单表单

上一章我们快速创建了一个能用的新建表单，现在来完善它——调整字段顺序、设置默认值、优化布局。如果你跳过了上一章的快速表单部分，也没关系，我们这里会从头开始新建表单。

### 添加"新建"操作按钮

1. 确保处于 UI 编辑器模式（右上角开关打开）。
2. 进入「工单列表」页面，点击表格区块上方的 **「[操作](/interface-builder/actions)（Actions）」**。
3. 勾选 **「添加」** 操作按钮。
4. 表格上方会出现一个「添加」按钮，点击它会打开一个[弹窗](/interface-builder/actions/pop-up)。

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### 配置弹窗中的表单

1. 点击「添加」按钮，打开弹窗。
2. 在弹窗中点击 **「创建[区块](/interface-builder/blocks)（Add block）」→ 数据区块 → 表单（添加）**。
3. 选择 **「当前[数据表](/data-sources/main/collection)（Current collection）」**。弹窗已经关联了对应的数据表上下文，无需手动指定。

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. 在表单中点击 **「[字段](/data-sources/field)（Fields）」**，勾选以下字段：

| 字段 | 配置要点 |
|------|---------|
| 标题 | 必填（跟随全局） |
| 描述 | 大文本输入 |
| 状态 | 下拉选择（后面会通过联动规则设默认值） |
| 优先级 | 下拉选择 |
| 分类 | 关联字段，自动显示为下拉选择器 |
| 提交人 | 关联字段（后面会通过联动规则设默认值） |
| 处理人 | 关联字段 |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

你会发现「标题」字段旁边自动带了红色星号 `*`——因为我们在第 2 章创建字段时已经设了必填，表单会自动继承数据表层面的必填规则，不用再单独配置。

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **小技巧**：如果某个字段在数据表层面没有设为必填，但你希望在当前表单中要求必填，也可以在字段配置项中单独设置。
> 
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### 添加提交按钮

1. 在表单区块下方，点击 **「操作（Actions）」**。
2. 勾选 **「提交」** 按钮。

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. 用户填完表单后，点击提交即可创建一条新工单。

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 联动规则：默认值与字段联动

有些字段我们希望自动填好（比如状态默认「待处理」），有些字段需要根据条件动态变化（比如紧急工单必填描述）。目前 2.0 的默认值功能形态还在演进中，本教程统一使用 **联动规则** 来配置默认值和字段联动。

1. 点击表单区块右上角的 **区块设置**（三横线图标）。
2. 找到 **「联动规则（Linkage rules）」**，点击后会在侧边栏打开配置面板。

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### 设置默认值

我们先为「状态」和「提交人」设置默认值：

1. 点击 **「添加联动规则」**。
2. **不设置条件**（留空即可）——无条件联动规则会在表单加载时立即执行。

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. 配置动作（Actions）：
   - 状态字段 → **设置默认值** → 待处理
   - 提交人字段 → **设置默认值** → 当前用户

> **注意字段值选择**：设置值时，一定要先选择 **「当前表单」** 作为数据来源。如果是关联对象字段（如分类、提交人、处理人等多对一字段），必须选择对象属性本身，而不是展开后的子字段。
>
> 选择变量（如「当前用户」）时，需要先**单击选中**变量，再**双击**将其填充到选择栏中。

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


如果希望某个字段提交人不能修改（比如状态），可以在字段配置项中将 **「显示模式（Display mode）」** 设为 **「只读（Readonly）」**。

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **三种显示模式**：可编辑（Editable）、只读（Readonly，禁止编辑但保留字段外观）、阅读模式（Easy-reading，仅显示文本）。

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### 紧急工单必填描述

接下来添加一条有条件的联动规则：当用户选择优先级为「紧急」时，描述字段变成**必填**，提醒提交人务必写清楚情况。

1. 点击 **「添加联动规则」**。

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. 配置规则：
   - **条件（Condition）**：当前表单 / 优先级 **等于** 紧急
   - **动作（Actions）**：描述字段 → 设为 **必填**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. 保存规则。

现在测试一下：选择优先级为「紧急」，描述字段旁边会出现红色星号 `*`，表示必填。选择其他优先级则恢复为非必填。

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

最后根据我们学到的，简单调整一下布局
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **联动规则还能做什么？** 除了设置默认值和控制必填，还可以控制字段的显示/隐藏、动态赋值。例如：当状态为「已关闭」时，隐藏处理人字段。后续章节遇到时我们再展开。

## 4.3 [详情区块](/interface-builder/blocks/data-blocks/details)

上一章我们给表格行加了「查看」按钮，点击会打开抽屉。现在来配置抽屉里的内容。

1. 在表格中点击某一行的 **「查看」** 按钮，打开抽屉。
2. 在抽屉中点击 **「创建区块（Add block）」→ 数据区块 → 详情**。
3. 选择 **「当前数据表（Current collection）」**。

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. 在详情区块中 **「字段（Fields）」**，布局如下：


| 区域 | 字段 |
|------|------|
| 顶部 | 标题、状态（标签样式） |
| 主体 | 描述（大文本区域） |
| 侧边信息 | 分类名称、优先级、提交人、处理人、创建时间 |

如何放置一个大标题？
选择 字段 > markdown > 编辑 markdown > 编辑区域中选择变量 > 当前记录 > 标题
这样就将记录的标题动态插入到了 markdown 区块中。
删除默认文本，用 markdown 语法，将它变为 二级标题的样式 （即前面加上 ## 空格 即可）

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

页面中本身的标题字段可以去掉了，调整一下详情表单布局

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **小技巧**：多个字段可以通过拖拽排列在同一行，让布局更紧凑美观。


1. 在详情区块的 **「操作（Actions）」** 中，勾选 **「编辑」** 按钮，方便直接从详情进入编辑模式。

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### 配置编辑表单

点击「编辑」按钮，会打开一个新弹窗——里面需要放一个编辑表单。编辑表单的字段和新建表单几乎一样，难道要再从头勾选一遍？

不用。还记得新建表单吗？我们先把它**保存为模板**，编辑表单直接引用就行。

**第一步：回到新建表单，保存为模板**

1. 关闭当前弹窗，回到工单列表，点击「添加」按钮打开新建表单。
2. 点击表单区块右上角的 **区块设置**（三横线图标），找到 **「保存为模板（Save as template）」**。

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. 点击保存即可，默认为 **「引用（Reference）」**——所有引用该模板的表单共享同一套配置，改一处全部同步。

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> 我们的工单表单不复杂，选「引用」统一维护更省心。如果选「复制」，则每个表单拿到独立副本，各自修改互不影响。

**第二步：在编辑弹窗中引用模板**

1. 回到详情抽屉或表格操作列，点击「编辑」按钮打开编辑弹窗。

你可能会想：直接通过 **「创建区块 → 其他区块 → 区块模板」** 来创建不就行了？试一下你会发现——这样创建出来的是一个**添加表单**，而且字段并没有自动填充。这是一个常见的坑。

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

正确的做法是：

2. 在弹窗中点击 **「创建区块（Add block）」→ 数据区块 → 表单（编辑）**，先正常创建一个编辑表单区块。
3. 在编辑表单中点击 **「字段（Fields）」→「字段模板（Field templates）」**，选择刚才保存的模板。
4. 字段会一键全部填充过来，和新建表单完全一致。
5. 别忘了加上操作按钮「提交」，让用户修改后能保存。

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

以后想加字段？只需在模板中修改一次，新建和编辑表单同步更新。

### 快速编辑：不开弹窗也能改数据

除了弹窗编辑，NocoBase 还支持直接在表格中**快速编辑**——不用打开任何弹窗，鼠标移上去就能改。

开启方式有两处：

- **表格区块级别**：点击表格区块的 **区块设置**（三横线图标），找到 **「快速编辑（Quick editing）」**，开启后整个表格的字段都支持快速编辑。
- **单个字段级别**：点击某一列的字段配置项，找到 **「快速编辑」**，可以逐个字段控制是否开启。

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

开启后，鼠标移到表格单元格上方会出现一个小铅笔图标，点击即可弹出该字段的编辑组件，修改后自动保存。

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **适合哪些场景？** 快速编辑非常适合需要批量修改状态、处理人等字段的场景。比如管理员浏览工单列表时，可以直接点击「状态」列快速把工单从「待处理」改成「处理中」，不用一个个打开编辑。

## 4.4 启用历史记录

工单系统最重要的一点是：**谁在什么时候改了什么，必须有迹可循**。NocoBase 内置了「历史记录」插件，帮我们自动记录每一次数据变更。

### 配置历史记录

1. 进入 **设置 → 插件管理**，确保「历史记录」（Record History）插件已启用。

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. 进入插件配置页面，点击 **「添加数据表」**，选择 **「工单」**。
3. 选择需要记录的字段：**标题、状态、优先级、处理人、描述** 等。

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **建议**：不需要记录所有字段。像 ID、创建时间这些不会手动修改的字段，没必要追踪。只记录业务上有意义的字段变更。

4. 这个时候回到配置项，点击 **「同步历史数据快照」**， 插件会自动把现有所有工单记录为第一条历史记录，后续每次修改都会新增一条历史记录。

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### 在详情页查看历史

1. 回到工单详情的抽屉页面（点击表格行的「查看」按钮）。
2. 在抽屉中 **「创建区块（Add block）」→ 历史记录**。
3. 选择 **「当前数据表」**，数据选择 **「当前记录」**。
4. 详情页底部会出现一个时间线，清晰展示每一次变更：谁在什么时间把哪个字段从什么值改成了什么值。

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

这样，即使工单经手了多人处理，所有变更都一清二楚。

## 小结

这一章我们完成了数据的完整生命周期：

- **表单** — 用户可以提交新工单，字段有默认值和验证
- **联动规则** — 紧急工单自动要求必填描述
- **详情区块** — 清晰展示工单的完整信息
- **历史记录** — 自动追踪每一次变更，审计无忧

从「看得见」到「填得进」再到「查得到」——我们的工单系统已经具备了基本的可用性。

## 相关资源

- [表单区块](/interface-builder/blocks/data-blocks/form) — 表单区块详细配置
- [详情区块](/interface-builder/blocks/data-blocks/details) — 详情区块配置
- [联动规则](/interface-builder/linkage-rules) — 字段联动规则说明
