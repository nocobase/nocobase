# Menu

<Alert type="warning">
菜单模块以后会重构，Item 直接用 items 对接，不用 schema 嵌套，Menu 也会开放到更多场景里使用。
</Alert>

## `x-initializer`

- MenuItemInitializers

## `x-designer`

- Menu.Designer

## `x-settings`

- MenuSettings

## UI Schema

### 菜单

```json
{
    "type": "void",
    "x-component": "Menu",
    "x-designer": "Menu.Designer",
    "x-initializer": "MenuItemInitializers",
    "x-component-props": {
        "mode": "mix",
        "theme": "dark",
        "onSelect": "{{ onSelect }}",
        "sideMenuRefScopeKey": "sideMenuRef"
    },
    "name": "lap9zil5z4u",
    "x-uid": "x77wpukk3qz",
    "x-async": false
}
```

### 菜单分组

```json
{
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "title": "Group",
    "x-component": "Menu.SubMenu",
    "x-decorator": "ACLMenuItemProvider",
    "x-component-props": {
      "icon": "alipaycircleoutlined",
    },
    "x-server-hooks": [
        {
            "type": "onSelfCreate",
            "method": "bindMenuToRole"
        },
        {
            "type": "onSelfSave",
            "method": "extractTextToLocale"
        }
    ],
    "x-uid": "zjxw5sph3do",
    "x-async": false,
    "x-index": 1
}
```

### 菜单页面

```json
{
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "title": "Page1",
    "x-component": "Menu.Item",
    "x-decorator": "ACLMenuItemProvider",
    "x-component-props": {
      "icon": "alipaycircleoutlined",
    },
    "x-server-hooks": [
        {
            "type": "onSelfCreate",
            "method": "bindMenuToRole"
        },
        {
            "type": "onSelfSave",
            "method": "extractTextToLocale"
        }
    ],
    "x-uid": "y0jp661nb8i",
    "x-async": false,
    "x-index": 2
}
```

### 链接

```json
{
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "title": "Link",
    "x-component": "Menu.URL",
    "x-decorator": "ACLMenuItemProvider",
    "x-component-props": {
        "href": "#",
        "icon": "alipaycircleoutlined"
    },
    "x-server-hooks": [
        {
            "type": "onSelfCreate",
            "method": "bindMenuToRole"
        },
        {
            "type": "onSelfSave",
            "method": "extractTextToLocale"
        }
    ],
    "x-uid": "ynembhzwcj1",
    "x-async": false,
    "x-index": 3
}
```