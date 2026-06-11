# 第 12 章：会议室预订与工作流

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

相信如今的你，对于 **NocoBase** 已经非常熟悉了。

在这一章中，我们来一同实现以一个特殊的场景：会议管理模块。

该模块包含了会议室预定与通知等功能。在这个过程中，我们将逐步从零构建一个会议管理模块，从基础开始，逐渐实现更复杂的功能。我们先来设计这个模块的基础数据表结构。

---

### 12.1 设计数据表结构

数据表结构可以理解为会议管理模块的基础框架。这里我们将重点介绍 **会议室表** 和 **预约表**，并且会涉及到一些新的关系，如和用户之间的[多对多](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)关系。

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 会议室表

会议室表用于存储所有会议室的基本信息，字段包括会议室的名称、位置、容量、配置等。

##### 表结构示例

```json
会议室（Rooms）
    ID（主键）
    会议室名称（name，单行文本）
    具体位置（location，多行文本）
    容量（capacity，整数）
    配置（equipment，多行文本）
```

#### 12.1.2 预约表

预约表用于记录所有的会议预约信息，字段包括会议室、参与用户、时间段、会议主题和描述等。

##### 表结构示例

```json
预约（Bookings）
    ID（整数，唯一主键）
    会议室（room，多对一关系，外键room_id关联到会议室ID）
    用户（users，多对多，关联到用户ID）
    开始时间（start_time，日期时间）
    结束时间（end_time，日期时间）
    会议标题（title，单行文本）
    会议描述（description，Markdown）
```

##### [多对多关系](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

在预约表中，涉及到一个“多对多”关系：一个用户可以参加多次会议，一场会议也可以有多个用户参与。这里的多对多关系需要配置好外键关联。为了便于管理，我们可以命名中间表为 **booking_users**。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 构建会议管理模块

在数据表结构设计好之后，我们可以按照设计创建两个表，并构建“会议管理”模块。以下是创建和配置步骤：

#### 12.2.1 建立[表格区块](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

首先，在页面中添加“会议管理”模块，分别创建 **会议室表格区块** 和 **预约表的[表格区块](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**。再创建一个预约表[日历区块](https://docs-cn.nocobase.com/handbook/calendar)，日历的默认视图设置为“天”。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### 设置会议室的表格区块关联

将会议室表格区块与其他两个区块进行关联，这样可以自动筛选出该会议室对应的预约记录。接着，可以尝试一下筛选、增删查改的功能，测试模块的基本交互。

> 💡**NocoBase区块连接（推荐！！）**：
>
> 除了之前的筛选区块。我们的表格区块，也可以和其他区块进行连接，从而实现点击筛选的效果。
>
> 如下图，我们在会议室表的配置中，连接其他两个预约表的区块（预定表-表格区块、预定表-日历区块）

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> 连接成功后，点击会议室表，你会发现其他两张表都跟着进行了筛选！再次点击选中项即可取消选中。
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 检测会议室占用情况

页面配置完成后，我们需要添加一个重要功能：检测会议室的占用情况。此功能在创建或更新会议时会检查目标会议室在指定时间段是否被占用，以避免预定冲突。

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 设置“操作前事件”[工作流](https://docs-cn.nocobase.com/handbook/workflow)

为了在预定时进行检测，我们使用一种特殊的工作流 —— [“操作前事件”](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor)：

- [**操作前事件**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor)（商业插件）：在增、删、改数据之前执行一系列操作，可随时暂停并提前拦截，这个方式十分贴近我们日常的代码开发流程！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 配置节点

在检测占用情况的工作流中，我们需要以下几类节点：

- [**运算节点**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)（数据转换逻辑，用于处理修改、新增的情况）
- [**SQL 操作**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)（执行 SQL 查询）
- [**JSON 解析**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)（商业插件，用于解析 JSON 数据）
- [**响应消息**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message)（商业插件，用于返回提示信息）

---

#### 12.3.3 绑定预约表和配置触发器

现在，我们绑定预约表，触发模式选择“全局模式”，并选择操作类型为创建记录和更新记录。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 配置[运算节点](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 创建“将空白 ID 转换为-1”运算节点

我们首先创建一个运算节点，用于将空白的 ID 转换为 -1。运算节点可以按照我们需要的方式转换变量，提供以下三种形式的操作：

- **Math.js**（参考[ Math.js](https://mathjs.org/)）
- **Formula.js**（参考[ Formula.js](https://formulajs.info/functions/)）
- **字符串模板**（用于数据拼接）

在此，我们使用 **Formula.js** 进行数值判断：

```html
IF(NUMBERVALUE(【触发器变量/参数/提交的值对象/ID】, '', '.'),【触发器变量/参数/提交的值对象/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. 创建 [SQL 操作节点](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

接下来，创建 SQL 操作节点，执行查询语句，检查可用的会议室：

#### 12.5.1 查询可用会议室 SQL 语句

```sql
-- 查询所有可被预定的会议室
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- 排除当前预订
  AND b.start_time < '{{$context.params.values.end_time}}' -- 开始时间在查询结束时间之前
  AND b.end_time > '{{$context.params.values.start_time}}' -- 结束时间在查询开始时间之后
WHERE b.id IS NULL;
```

> SQL 注意点：变量会直接替换进入 sql 语句，请仔细检查变量，避免出现 SQL 注入情况。在合适的地方添加单引号。

其中变量分别为：

{{$jobsMapByNodeKey.3a0lsms6tgg}} 代表 上一节点的结果， 【节点数据/将空白 ID 转换为-1】

{{$context.params.values.end_time}} 代表 【触发器变量/参数/提交的值对象/结束时间】

{{$context.params.values.start_time}} 代表 【触发器变量/参数/提交的值对象/开始时间】

#### 12.5.2 测试 SQL

我们目的是查询出与目标时间节点不冲突的所有会议室。

在此期间，可以点击下方”Test run“ ，更改变量值，调试 SQL

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [JSON 解析](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 配置 [JSON 解析节点](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

通过上一步的测试，我们可以观察到结果为如下这种形式，此时需要开启 [**JSON query node插件**](https://docs-cn.nocobase.com/handbook/workflow-json-query)：

```json
[
  {
    "id": 2,
    "name": "会议室2"
  },
  {
    "id": 1,
    "name": "会议室1"
  }
]
```

> JSON 的解析方式分为三种，分别为：
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

此处我们任选一种，如 [JMESPath](https://jmespath.org/) 格式，我们需要筛选所有可用的会议室名称列表，故表达式填写：

```sql
[].name
```

属性映射配置是针对对象列表进行的，目前并不必要，可不用填写

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [条件判断](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

配置条件判断节点，判断当前会议室是否在可用会议室列表中。根据判断结果的 **是** 或 **否**，分别配置响应消息：

判断条件，选用”基础“运算即可:

```json
【节点数据 / 解析会议室列表】 包含 【触发器变量 / 参数 / 提交的值对象 / 会议室 / 名称】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 是：配置成功消息

此时需要开启[**Workflow: Response message插件**](https://docs-cn.nocobase.com/handbook/workflow-response-message)：

```json
【触发器变量/参数/提交的值对象/会议室/名称】  可用，预定成功！
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 否：配置失败消息

```json
目标会议室不可用，可用会议室列表：【节点数据/解析会议室列表】
```

注意，我们在判定失败时，一定要配置”结束流程“节点，手动结束流程。

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 功能检测与调试详解

现在我们进入会议管理系统的最终测试环节。这个环节的目的是确认我们的工作流是否能够正确检测，并阻止冲突的会议室预定。

#### 12.8.1 添加冲突时间段的预定

首先，我们尝试添加一个与已有预定时间冲突的会议，看看系统是否会阻止操作，并弹出错误提示。

- 设置冲突的预定时间段

我们尝试在“会议室 1”添加一个新的预定，时间为

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

这个时间跨度覆盖了全天，我们故意制造了与现有预定时间的冲突

- 确认已存在的会议预定

在“会议室 1”中，已经存在两个预定时间段：

1. `2024-11-14 09:00:00 至 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 至 2024-11-14 16:30:00`

这两个时间段均与我们要添加的时间段

（`2024-11-14 00:00:00 - 2024-11-14 23:00:00`）

有重叠。

因此，根据逻辑判断，系统应该检测到时间冲突并阻止此次预定。

- 提交预定并验证反馈

我们点击 **提交** 按钮，系统会执行工作流中的检测流程：

**成功反馈：** 提交后，系统弹出冲突提示，说明检测逻辑正常。页面反馈成功地提示我们无法完成此次预定。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 添加无冲突的预定时间段

接下来测试无冲突的预定~

确保当会议时间不重叠时，我们能够成功预定会议室！

- 设置无冲突的预定时间段

我们选择一个没有冲突的时间段，比如

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`。

该时间段与现有的预约时间不重叠，因此符合会议室预定要求。

- 提交无冲突的预定

点击 **提交** 按钮，系统再次执行工作流的检测逻辑：

**一起来验证一下：** 提交成功！系统显示“预定成功”提示。说明无冲突情况下的预定功能也正常工作。

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 修改已有预定的时间

除了新增预定，小伙伴们还可以测试修改已存在的预约时间。

例如，将已有的会议时间改为另一个无冲突的时间段，再次点击提交。

这一步就交给你们啦。

---

### 12.9  仪表盘优化与个人日程面板

在测试功能全部通过后，我们可以进一步美化和优化仪表盘，以提升用户体验。

#### 12.9.1 调整仪表盘布局

在仪表盘中，我们可以根据用户的操作习惯来重新排布页面内容，以便用户更方便地查看系统数据情况。

为了进一步提升用户体验，可以为每位用户创建一个专属的会议日程面板。具体操作如下：

1. **新建“个人日程”区块**：在仪表盘中添加一个新的日历或列表区块，显示用户个人的会议日程。
2. **设置成员默认值**：将成员的默认值设置为当前用户，使用户打开仪表盘时默认显示与自己相关的会议。

进一步优化用户在会议管理模块的使用体验。

完成这些配置后，仪表盘的功能和布局更直观易用，功能也丰富了不少！

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

通过以上步骤，我们成功实现并优化了会议管理模块的主要功能！希望在操作中，您能逐步掌握 NocoBase 的核心功能，体验模块化构建系统的乐趣。

---

继续探索，尽情发挥你的创造力！如果遇到问题，不要忘了随时可以查阅 [NocoBase 官方文档](https://docs-cn.nocobase.com/) 或加入 [NocoBase 社区](https://forum.nocobase.com/) 进行讨论。
