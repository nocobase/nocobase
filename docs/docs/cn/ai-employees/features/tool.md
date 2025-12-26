# 使用技能

主流大语言模型都有使用工具的能力，AI 员工插件内置了一些常用工具供大语言模型使用。

在 AI 员工设置页设置的技能就是供大语言模型使用的工具。

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## 设置技能

进入 AI 员工插件配置页面，点击 `AI employees` 标签页，进入 AI 员工管理页。

选择要设置技能的 AI 员工，点击 `Edit` 按钮，进入 AI 员工编辑页面。

在`Skills` 标签页中点击 `Add Skill` 按钮为当前 AI 员工添加技能。

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## 技能介绍

### Frontend

Frontend 分组让 AI 员工可以和前端组件交互

- `Form filler` 技能让 AI 员工可以把生成的表单数据回填到用户指定的表单中。

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)


### Data modeling

Data modeling 分组技能让 AI 员工拥有了调用 NocoBase 内部接口进行数据建模的能力。

- `Intent Router` 意图路由，判断用户是要修改数据表结构，还是创建新的数据表结构。
- `Get collection names` 获取系统内已存在的所有数据表名称。
- `Get collection metadata` 获取指定数据表结构信息。
- `Define collections` 让 AI 员工可以在系统中创建数据表

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` 让 AI 员工具备执行工作流的能力，在工作流插件里配置 `Trigger type` 为 `AI employee event` 的工作流会在这里作为技能供 AI 员工使用

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Code Editor 分组下的技能主要让 AI 员工具有和代码编辑器交互的能力。

- `Get code snippet list` 获取预置的代码片段列表。
- `Get code snippet content` 获取指定代码片段内容。

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator` 让 AI 员工拥有生成图表的能力，在对话中直接输出图表

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)
