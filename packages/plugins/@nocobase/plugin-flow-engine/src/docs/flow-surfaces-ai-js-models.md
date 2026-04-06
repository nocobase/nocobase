# FlowSurfaces AI JS Models

这份文档专门说明 `flowSurfaces` 已公开支持的 JS 系列能力。

## 公开能力总览

### `jsBlock`

- public block key: `jsBlock`
- model use: `JSBlockModel`
- 适用位置：page/tab/grid 下直接创建
- 推荐入口：`compose.blocks[].type = "jsBlock"` 或 `addBlock(type="jsBlock")`
- 高频改配：`configure({ title, description, className, code, version })`

### `js` action

- public action key: `js`
- 运行时会根据容器自动映射到具体模型：
  - collection 容器 -> `JSCollectionActionModel`
  - record 容器 -> `JSRecordActionModel`
  - form 容器 -> `JSFormActionModel`
  - filter-form 容器 -> `FilterFormJSActionModel`
  - action-panel 容器 -> `JSActionModel`
- 高频改配：`configure({ title, icon, type, code, version })`

### 绑定字段 JS 变体：`renderer: "js"`

也可以记成 `renderer: \`js\``，意思相同。

- table/details/list/gridCard -> wrapper + `JSFieldModel`
- form/createForm/editForm -> wrapper + `JSEditableFieldModel`
- filterForm 不支持

### 非绑定 JS 项

- `type: "jsColumn"` -> `JSColumnModel`，仅 table
- `type: "jsItem"` -> `JSItemModel`，仅 form/createForm/editForm

## 推荐调用方式

### 1. 创建 `jsBlock`

```json
{
  "target": {
    "uid": "page-grid-uid"
  },
  "blocks": [
    {
      "key": "hero",
      "type": "jsBlock",
      "settings": {
        "title": "Users hero",
        "description": "Custom hero area",
        "className": "users-hero",
        "version": "1.0.0",
        "code": "return { type: 'div', children: ['Users hero'] };"
      }
    }
  ]
}
```

### 2. 创建 `js` action

```json
{
  "target": {
    "uid": "action-panel-uid"
  },
  "type": "js",
  "settings": {
    "title": "Run JS",
    "type": "primary",
    "version": "1.0.0",
    "code": "return await ctx.runjs('console.log(\"hello\")');"
  }
}
```

### 3. 创建绑定字段 JS 变体

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "fieldPath": "nickname",
  "renderer": "js"
}
```

### 4. 创建 `jsColumn`

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "type": "jsColumn",
  "settings": {
    "title": "Runtime column",
    "version": "1.0.0",
    "code": "return record.nickname;"
  }
}
```

### 5. 创建 `jsItem`

```json
{
  "target": {
    "uid": "create-form-grid-uid"
  },
  "type": "jsItem",
  "settings": {
    "label": "Runtime item",
    "showLabel": true,
    "version": "1.0.0",
    "code": "return record.nickname;"
  }
}
```

## 推荐的 `configure` 映射

### `jsBlock`

- `title` -> `decoratorProps.title`
- `description` -> `decoratorProps.description`
- `className` -> `decoratorProps.className`
- `code/version` -> `stepParams.jsSettings.runJs`

### `js` action

- `title/icon/type/danger/color` -> action button props
- `code/version` -> `stepParams.clickSettings.runJs`

### `renderer: "js"` field

- wrapper 仍支持 `label/tooltip/width/titleField/clickToOpen/openView`
- `code/version` 会同步写到 inner JS field 的 `stepParams.jsSettings.runJs`

### `jsColumn`

- `title/tooltip/width/fixed` -> props
- `code/version` -> `stepParams.jsSettings.runJs`

### `jsItem`

- `label/tooltip/extra/showLabel` -> props
- `labelWidth/labelWrap` -> decoratorProps
- `code/version` -> `stepParams.jsSettings.runJs`

## 不支持的组合

- `filterForm` + `renderer: "js"`
- form/createForm/editForm + `type: "jsColumn"`
- table/details/list/gridCard + `type: "jsItem"`

## `ctx` 使用建议

JS 代码里可以优先从当前运行时上下文拿：

- `ctx.runjs(...)`
- `ctx.useResource(...)`
- 当前记录、当前表单值、当前弹窗上下文

`jsBlock` 不自动推导 collection 资源。如果需要数据访问，建议在代码里显式 `ctx.useResource(...)`。
