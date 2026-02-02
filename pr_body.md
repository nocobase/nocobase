<!--
First of all, thank you for your contribution! 
For bug fixes or other non-feature modifications, please base your branch on the main branch.
For new features or API modifications, please make sure your branch is based on the next branch. 
Thank you!
-->

### This is a ...
- [x] New feature
- [ ] Improvement
- [ ] Bug fix
- [ ] Others

### Motivation
前端 V2 筛选表单新增关系字段目标表字段选择能力，并确保与现有字段创建逻辑兼容。

### Description 
- 筛选表单字段选择新增 “Association fields” 分组，支持递归多层级关系字段目标表字段。
- 选择关系目标字段时，自动连接目标区块（与普通字段一致）。
- 新增单测覆盖：分组与递归路径、关系目标字段自动连接。
- 风险：递归深度上限为 5，用于避免循环关系导致无限递归。
- 测试建议：新增/选择关系字段目标表字段，确认筛选生效且目标区块自动关联；普通字段行为保持不变。

### Related issues

### Showcase

### Changelog

| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | Support selecting association target fields in V2 filter form and auto-connect target blocks |
| 🇨🇳 Chinese | 支持 V2 筛选表单选择关系字段目标表字段并自动连接目标区块 |

### Docs

| Language   | Link |
| ---------- | --------- |
| 🇺🇸 English |  <!-- [Title](link) -->    |
| 🇨🇳 Chinese |  <!-- [标题](link) -->  |

### Checklists
- [x] All changes have been self-tested and work as expected
- [x] Test cases are updated/provided or not needed
- [x] Doc is updated/provided or not needed
- [x] Component demo is updated/provided or not needed
- [x] Changelog is provided or not needed
- [ ] Request a code review if it is necessary
