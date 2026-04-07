<!--
First of all, thank you for your contribution! 
For bug fixes or other non-feature modifications, please base your branch on the main branch.
For new features or API modifications, please make sure your branch is based on the next branch. 
Thank you!
-->

### This is a ...
- [ ] New feature
- [ ] Improvement
- [x] Bug fix
- [ ] Others

### Motivation
修复 v1 页面中“提交 -> 字段赋值”配置链路的弹窗层级问题。此前在字段赋值弹窗内继续打开字段设置弹窗或删除确认框时，子弹窗可能被父弹窗或右侧设置面板遮挡。

### Description 
为 schema settings 相关弹窗补充统一的 z-index 计算逻辑，使字段设置弹窗和删除确认框都能在嵌套场景下正确浮到父层之上，同时保留普通页面下不低于 Ant Design 默认弹窗层级的下限。补充了针对层级计算的单元测试。

风险与验证建议：
- 重点回归 v1 页面“提交 -> 字段赋值”里的“编辑字段标题 / 编辑描述 / 编辑提示信息 / 设置验证规则 / 删除”
- 再回归普通 schema settings 页面里的删除确认框，确认没有被其他弹层压住

### Showcase
<!-- Including any screenshots of the changes. -->

### Changelog

| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | Fix the issue where schema settings popups are obscured in v1 field assignment |
| 🇨🇳 Chinese | 修复 v1 字段赋值中配置弹窗被遮挡的问题 |

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
