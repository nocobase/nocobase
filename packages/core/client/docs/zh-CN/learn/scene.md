# Scene

## 区块扩展（Block Extension）

`scene` 支持以下四种场景：

* **one**：用于展示单条数据的详情页面或编辑表单
* **many**：用于展示多条数据的表格、列表等
* **new**：用于新增数据的页面或表单
* **select**：用于选择数据的界面

```ts
class MyBlockModel extends CollectionBlockModel {
  static scene = ['one', 'many', 'new', 'select'];
}
```

---

## 操作扩展（Action Extension）

`scene` 支持以下两种场景：

* **collection**：针对数据表整体的操作（如批量导入、导出等）
* **record**：针对单条数据记录的操作（如编辑、删除等）

```ts
class MyActionModel extends ActionModel {
  static scene = ['record', 'collection'];
}
```

---

## 字段扩展（Field Extension）

`scene` 支持以下三种场景：

* **edit**：输入或选择数据的控件（编辑场景）
* **display**：仅用于展示数据的控件
* **filter**：用于筛选条件的控件

```ts
class MyFieldModel extends FieldModel {
  static scene = ['edit', 'display', 'filter'];
}
```

---

## 扩展类型与 scene 对照表

| 扩展类型       | 可选 `scene`   | 说明                      |
| ---------- | ------------ | ----------------------- |
| **Block**  | `one`        | 展示单条数据详情（如详情页、编辑表单）     |
|            | `many`       | 展示多条数据（如表格、列表）          |
|            | `new`        | 新增数据的表单/页面              |
|            | `select`     | 数据选择场景（如选择器、弹窗）         |
| **Action** | `collection` | 针对整个数据表的操作（如导入、导出、批量操作） |
|            | `record`     | 针对单条记录的操作（如编辑、删除）       |
| **Field**  | `edit`       | 可输入、选择的控件（编辑场景）         |
|            | `display`    | 纯展示控件（只读场景）             |
|            | `filter`     | 筛选条件控件（搜索、过滤场景）         |
