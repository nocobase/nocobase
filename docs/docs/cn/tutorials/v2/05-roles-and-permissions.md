# 第 5 章：用户与权限 — 谁能看什么

上一章我们把表单和详情页做好了，工单系统已经能正常录入和查看数据。但现在有个问题——所有人登录后看到的东西都一样。提交工单的普通员工能看到管理[页面](/interface-builder/pages)，技术员能删除分类……这可不行。

这一章，我们来给系统加上"门禁"：创建[角色](/users-permissions/role)、配置[菜单权限](/users-permissions/role/menu-permissions)和[数据范围](/users-permissions/role/data-scope)，实现**不同的人，看到不同的[菜单](/interface-builder/menus)，操作不同的数据**。

## 5.1 理解[角色](/users-permissions/role)（Role）

在 NocoBase 里，**角色就是一组[权限](/users-permissions/role)的集合**。你不需要给每个用户单独配权限，而是先定义好几个角色，再把用户丢进对应的角色里。

NocoBase 安装后自带三个角色：

- **Root**：超级管理员，拥有一切权限，不可删除
- **Admin**：管理员，默认拥有配置界面的权限
- **Member**：普通成员，默认权限较少

但这三个内置角色不够用。我们的工单系统需要更细的划分，所以接下来我们创建 3 个自定义角色。

## 5.2 创建三个角色

打开右上角设置菜单，进入 **用户和权限 → 角色管理**。

点击 **添加角色**，依次创建：

| 角色名称 | 角色标识 | 说明 |
|---------|---------|------|
| 管理员 | admin-helpdesk | 能看所有工单，管理分类，分配处理人 |
| 技术员 | technician | 只看分配给自己的工单，能处理和关闭 |
| 普通用户 | user | 只能提交工单，只能看自己提交的 |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> **角色标识**是系统内部用的唯一 ID，创建后不能改，建议用英文小写。角色名称可以随时修改。

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

创建完成后，角色列表里应该能看到我们新建的三个角色。


## 5.3 配置菜单权限

角色建好了，接下来告诉系统：每个角色能看到哪些菜单。

点击某个角色进入权限配置页面，找到 **菜单访问权限** 选项卡。这里会列出系统中所有的菜单项，勾选就是允许访问，取消勾选就是隐藏。

**管理员（admin-helpdesk）**：全部勾选
- 工单管理、分类管理、仪表盘——都能看到

**技术员（technician）**：部分勾选
- ✅ 工单管理
- ✅ 仪表盘
- ❌ 分类管理（技术员不需要管分类）

**普通用户（user）**：最少权限
- ✅ 工单管理（只能看到自己的工单）
- ❌ 分类管理
- ❌ 仪表盘

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **小提示**：NocoBase 有个方便的设置——"新增菜单项默认允许访问"。如果你不想每次加新页面都手动勾选，可以给管理员角色开启这个选项。对于普通用户角色，建议关闭它。

## 5.4 配置数据权限

菜单权限管的是"能不能进这个页面"，数据权限管的是"进了页面后能看到哪些数据"。

关键概念：**[数据范围](/users-permissions/role/data-scope)（Data Scope）**。

在角色的权限配置中，切换到 **[数据表](/data-sources/main/collection)操作权限** 选项卡。找到我们的"工单"表，点击进入单独配置。

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### 普通用户：只看自己提交的工单

1. 找到"工单"表的 **查看** 权限
2. 数据范围选择 → **自己的数据**
3. 这样普通用户只能看到"创建人是自己"的工单 （需要注意，默认选项是以系统创建人字段为准，而非 提交人 字段，不过可以修改）

同理，把"编辑"和"删除"权限也设为 **自己的数据**（或者干脆不给删除权限）。

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


关于全局配置：如果只配置工单表，可能导致其他数据、配置项（比如分类表、处理人）看不到。我们目前的系统比较简单，本次在全局中直接勾选 “查看所有数据”，针对数据范围敏感的表，再单独配置权限

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### 技术员：只看分配给自己的工单

1. 找到"工单"表的 **查看** 权限
2. 数据范围选择 → **自己的数据**
3. 但这里有个细节——NocoBase 的"自己的数据"默认是按创建人过滤的。如果我们希望按"处理人"过滤，可以在全局[操作权限](/users-permissions/role/action-permissions)里进一步调整，或者在前端页面用 **数据[区块](/interface-builder/blocks)的筛选条件** 配合实现

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **实用技巧**：还可以在表格区块上设置默认筛选条件来辅助权限控制，比如"处理人 = 当前用户"。不过页面配置是全局生效的，管理员也会被限制。折中方案：配置"处理人 = 当前用户 **或** 提交人 = 当前用户"，兼容普通用户和技术员；管理员如需全局视图，再单独建一个不带筛选的页面。

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### 管理员：看到所有数据

管理员角色的数据范围选择 **所有数据**，所有操作都打开。简单直接。

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 工单分配操作

权限配好之前，我们先给工单列表加一个实用功能：**分配处理人**。管理员可以直接在列表中把工单分配给某个技术员，不用进入编辑页面改一堆字段。

实现很简单——在表格操作列加一个自定义弹窗按钮：

1. 进入 UI 编辑器模式，在工单列表表格的操作列中，点击 **「+」** 添加一个 **「弹窗（Popup）」** 操作按钮。

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. 将按钮标题改为 **「分配」**（点击按钮配置项修改标题）。

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


由于只有一个简单的分配信息，我们采用简单的弹窗更合适，而不是抽屉，按钮右上角选择 弹窗设置，选择 对话框 较窄 > 确认
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. 点击「分配」按钮打开弹窗，在弹窗中 **「创建区块 → 数据区块 → 表单（编辑）」**，选择当前数据表。
4. 在表单中只勾选 **「处理人」** 一个字段，并在字段配置项中设为 **必填**。
5. 添加 **「提交」** 操作按钮。

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

这样，管理员在工单列表中点击「分配」，弹出一个极简表单，选择处理人后提交即可。快速、精准，不会误改其他字段。

### 用联动规则控制按钮显隐

「分配」按钮只有管理员才需要用，普通用户和技术员看到它反而造成困惑。我们可以用**联动规则**根据当前用户的角色来控制按钮的显示/隐藏：

1. 在 UI 编辑器模式下，点击「分配」按钮的配置项，找到 **「联动规则」**。
2. 添加一条规则，条件设为：**当前用户 / 角色 / 角色名称** 不等于 **管理员**（即 admin-helpdesk 角色对应的名称）。
3. 满足条件时的动作：**隐藏** 该按钮。

这样，只有管理员角色的用户能看到「分配」按钮，其他角色登录后这个按钮自动隐藏。

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 创建测试用户并体验

权限配好了，我们来实际验证一下。

进入 **用户管理**（设置中心或者你之前搭好的用户管理页面），创建 3 个测试用户：

| 用户名 | 角色 |
|-------|------|
| Alice | 管理员（admin-helpdesk） |
| Bob | 技术员（technician） |
| Charlie | 普通用户（user） |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

创建好之后，分别用这三个账号登录系统，检查两件事：

**1. 菜单是否按预期显示？**
- Alice → 能看到所有菜单

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → 只看到工单管理和仪表盘

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → 只看到"我的工单"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. 数据是否按预期过滤？**
- 先用 Alice 创建几条工单，分别分配给不同处理人
- 切换到 Bob 登录 → 只看到分配给自己的工单
- 切换到 Charlie 登录 → 只看到自己提交的工单

是不是很酷？同一个系统，不同用户看到完全不同的内容！这就是权限的力量。

## 小结

这一章我们完成了工单系统的权限体系：

- **3 个角色**：管理员、技术员、普通用户
- **菜单权限**：控制每个角色能进哪些页面
- **数据权限**：控制每个角色能看到哪些数据（通过数据范围实现）
- **测试验证**：用不同账号登录，确认权限生效

到这里，工单系统已经像模像样了——能录入、能查看、能按角色控制访问。但所有操作都是手动的。

## 下一章预告

下一章我们来学 **工作流（Workflow）**——让系统自动帮我们干活。比如工单提交后自动通知处理人，状态变更时自动记录日志。

## 相关资源

- [用户管理](/users-permissions/user) — 用户管理详解
- [角色与权限](/users-permissions/role) — 角色配置说明
- [数据范围](/users-permissions/role/data-scope) — 数据级权限控制
