# Models 扩展指南

NocoBase 为用户提供了便捷的 **区块 (Blocks)**、**操作 (Actions)** 和 **字段 (Fields)** 扩展方式。
你既可以通过 **插件 (Plugin)** 的方式扩展，也可以直接在系统里在线编写 JS 的方式进行扩展。

* **插件扩展**：适合复杂场景，支持代码组织、版本管理、复用，可以继承相关基类进行扩展。
* **在线 JS 扩展**：适合快速实验、简单逻辑，轻量级扩展，无需额外插件。

---

## 区块 (Blocks)

| 模型                       | 说明                         |
| ------------------------ | -------------------------- |
| [BlockModel](/models/blocks/block-model)           | 基础区块模型。                    |
| [DataBlockModel](/models/blocks/data-block-model)       | 数据区块（不绑定数据表）。 |
| [CollectionBlockModel](/models/blocks/collection-block-model) | 数据表区块。     |
| [FilterBlockModel](/models/blocks/filter-block-model)     | 筛选区块。                 |
| [JSBlockModel](/models/blocks/js-block-model)         | 通过 JS 自定义渲染区块，适合高度灵活的场景。 |

---

## 操作 (Actions)

| 模型                   | 说明                        |
| -------------------- | ------------------------- |
| [ActionModel](/models/actions/action-model)      | 基础操作模型。 |
| [PopupActionModel](/models/actions/popup-action-model) | 弹窗操作。     |
| [JSActionModel](/models/actions/js-action-model)    | 通过 JS 自定义操作的点击逻辑，可实现任意业务行为。 |

---

## 字段 (Fields)

| 模型                      | 说明               |
| ----------------------- | ---------------- |
| [FieldModel](/models/fields/field-model)          | 基础字段模型。          |
| [ClickableFieldModel](/models/fields/clickable-field-model) | 可点击字段，适合跳转或触发操作。 |
| [JSFieldModel](/models/fields/js-field-model)        | 通过 JS 自定义渲染字段。   |
| [JSItemModel](/models/fields/js-item-model)         | 通过 JS 自定义渲染的项（不绑定字段信息）。    |
| [JSColumnModel](/models/fields/js-column-model)       | 通过 JS 自定义渲染表格列。     |
