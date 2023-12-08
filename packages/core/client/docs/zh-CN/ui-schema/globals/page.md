# Page

<Alert type="warning">
现在页面依赖菜单，以后会独立出来，也可以创建无菜单的页面。另外，页面的标签页的设计还有问题。
</Alert>

## `x-initializer` 

- PageTabsInitializers（暂无）
- BlockInitializers

## `x-designer`

- PageDesigner（暂无）
- PageTabsDesigner（暂无）

## `x-settings`

- PageSettings

## UI Schema

### 页面区块

```json
{
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "x-component": "Page",
    "title": "AA333",
    "x-component-props": {
        "enablePageTabs": true,
        "hidePageTitle": true,
        "disablePageHeader": true
    },
    "properties": {
        "nzxygx0iady": {
            "_isJSONSchemaObject": true,
            "version": "2.0",
            "type": "void",
            "x-component": "Grid",
            "x-initializer": "BlockInitializers",
            "x-uid": "z8hxh8fxksb",
            "x-async": false,
            "x-index": 1
        }
    },
    "x-uid": "9stdz1ld2p5",
    "x-async": true,
    "x-index": 1
}
```

### 页面标签页

```json
{
  "x-uid": "cqq0ythy0yj",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-component": "Page",
  "x-component-props": {
    "enablePageTabs": true
  },
  "properties": {
    "o8gqaximg8c": {
      "x-uid": "lzz2tqi8sxp",
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "Grid",
      "x-initializer": "BlockInitializers",
      "title": "Tab1",
      "x-async": false,
      "x-index": 1
    },
    "zjl1itzi6t8": {
      "x-uid": "x10ru2grypq",
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "title": "Tab2",
      "x-component": "Grid",
      "x-initializer": "BlockInitializers",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-async": true,
  "x-index": 1
}
```