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
修复表格中“新增(Add new)”按钮在被联动规则设置为禁用时不生效的问题，导致无法通过联动规则控制新增按钮的可交互性。

### Description 
- 将 `CreateRecordAction` 的渲染逻辑与通用 `Action` 对齐，合并 `form.disabled`、`field.data.disabled`、`field.componentProps.disabled`、`props.disabled` 等来源，确保联动规则设置的禁用状态能正确影响按钮（包含普通按钮与下拉按钮场景）。
- 该改动对行为向后兼容，不影响隐藏、ACL、设计态透明度等其它逻辑。

测试建议：
- 在表格中为“新增”按钮配置联动规则（使其 disabled），验证页面中按钮变为不可交互状态。
- 添加对应的 E2E 测试以覆盖普通按钮与带下拉的按钮场景。

### Related issues

### Showcase
- 无视觉改动，仅行为修复，截图/录屏可在必要时提供。

### Changelog
| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | Fix the issue where the "Add" button cannot be disabled by linkage rules |
| 🇨🇳 Chinese | 修复新增按钮无法被联动规则禁用的问题 |

### Docs
| Language   | Link |
| ---------- | ---- |
| 🇺🇸 English |  <!-- [Title](link) -->    |
| 🇨🇳 Chinese |  <!-- [标题](link) -->  |

### Checklists
- [x] All changes have been self-tested and work as expected
- [ ] Test cases are updated/provided or not needed
- [ ] Doc is updated/provided or not needed
- [ ] Component demo is updated/provided or not needed
- [x] Changelog is provided or not needed
- [ ] Request a code review if it is necessary
