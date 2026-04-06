# FlowSurfaces AI JS Models

This document explains the JS capabilities that `flowSurfaces` publicly supports today.

## Public capability overview

### `jsBlock`

- public block key: `jsBlock`
- model use: `JSBlockModel`
- supported placement: create directly under page/tab/grid
- recommended entry: `compose.blocks[].type = "jsBlock"` or `addBlock(type="jsBlock")`
- common high-frequency config: `configure({ title, description, className, code, version })`

### `js` action

- public action key: `js`
- runtime model mapping is chosen automatically from the container:
  - collection container -> `JSCollectionActionModel`
  - record container -> `JSRecordActionModel`
  - form container -> `JSFormActionModel`
  - filter-form container -> `FilterFormJSActionModel`
  - action-panel container -> `JSActionModel`
- common high-frequency config: `configure({ title, icon, type, code, version })`

### `jsItem` action

- public action key: `jsItem`
- model use: `JSItemActionModel`
- supported placement: action containers of form / createForm / editForm
- recommended entry: `addAction(type="jsItem")`
- common high-frequency config: `configure({ title, icon, type, code, version })`

### Bound-field JS variant: `renderer: "js"`

You can also write it as `renderer: \`js\``. The meaning is the same.

- table/details/list/gridCard -> wrapper + `JSFieldModel`
- form/createForm/editForm -> wrapper + `JSEditableFieldModel`
- filterForm is not supported

### Standalone JS items

- `type: "jsColumn"` -> `JSColumnModel`, table only
- `type: "jsItem"` -> `JSItemModel`, form/createForm/editForm only
- runtime / validator context model name for an inline form JS field item -> `FormJSFieldItemModel`
  - this means upstream RunJS recognizes that model name in the real runtime context
  - public creation of a bound JS field inside a form still uses `fieldPath + renderer: "js"`

## Recommended request patterns

### 1. Create a `jsBlock`

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
        "code": "ctx.render('<div>Users hero</div>');"
      }
    }
  ]
}
```

### 2. Create a `js` action

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
    "code": "await ctx.runjs('console.log(\"hello\")');"
  }
}
```

### 2.1 Create a form `jsItem` action

```json
{
  "target": {
    "uid": "create-form-uid"
  },
  "type": "jsItem",
  "settings": {
    "title": "Run item JS",
    "type": "default",
    "version": "1.0.0",
    "code": "await ctx.runjs('console.log(\"item\")');"
  }
}
```

### 3. Create a bound-field JS variant

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "fieldPath": "nickname",
  "renderer": "js"
}
```

### 4. Create a `jsColumn`

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "type": "jsColumn",
  "settings": {
    "title": "Runtime column",
    "version": "1.0.0",
    "code": "ctx.render(String(ctx.record?.nickname || ''));"
  }
}
```

### 5. Create a `jsItem`

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
    "code": "ctx.render(String(ctx.record?.nickname || ''));"
  }
}
```

## Recommended `configure` mappings

### `jsBlock`

- `title` -> `decoratorProps.title`
- `description` -> `decoratorProps.description`
- `className` -> `decoratorProps.className`
- `code/version` -> `stepParams.jsSettings.runJs`

### `js` action

- `title/icon/type/danger/color` -> action button props
- `code/version` -> `stepParams.clickSettings.runJs`

### `renderer: "js"` field

- the wrapper still supports `label/tooltip/width/titleField/clickToOpen/openView`
- `code/version` is synchronized into the inner JS field `stepParams.jsSettings.runJs`

### `jsColumn`

- `title/tooltip/width/fixed` -> props
- `code/version` -> `stepParams.jsSettings.runJs`

### `jsItem`

- `label/tooltip/extra/showLabel` -> props
- `labelWidth/labelWrap` -> decoratorProps
- `code/version` -> `stepParams.jsSettings.runJs`

## Unsupported combinations

- `filterForm` + `renderer: "js"`
- form/createForm/editForm + `type: "jsColumn"`
- table/details/list/gridCard + `type: "jsItem"`

## `ctx` usage tips

In JS code, prefer reading what you need from the current runtime context:

- `ctx.runjs(...)`
- `ctx.initResource(...)` / `ctx.resource`
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons`
- `ctx.React` / `ctx.ReactDOM` / `ctx.antd` / `ctx.antdIcons` aliases
- the current record, current form values, and current popup context

`jsBlock` does not bind a resource by default. If you need data access, initialize it explicitly with `ctx.initResource(...)` and continue through `ctx.resource`.
