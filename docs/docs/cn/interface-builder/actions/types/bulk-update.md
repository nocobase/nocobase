---
pkg: "@nocobase/plugin-action-bulk-update"
---
# 批量更新

## 介绍

批量更新操作用于需要对一组记录进行相同更新的情况，在执行批量更新操作之前，用户需要预先定义好更新的字段赋值逻辑。这一套逻辑将在用户点击更新按钮时应用到所有选中的记录上。

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## 操作配置

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### 更新的数据

选中/所有，默认为选中。

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### 字段赋值

设置批量更新的字段，只有设置的字段会更新。

如图在订单表格中配置批量更新操作，将选中的数据批量更新为「待审批」。

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [编辑按钮](/interface-builder/actions/action-settings/edit-button)：编辑按钮的标题、类型、图标；
- [联动规则](/interface-builder/actions/action-settings/linkage-rule)：动态显示/隐藏按钮；
- [二次确认](/interface-builder/actions/action-settings/double-check)
