
# MobileLayout

移动端布局组件。

主要作用有：

- 渲染 `MobileProviders` 上下文
- 通过 `RemoteSchemaComponent` 获取 `x-uid` 为 `nocobase-mobile` 的 schema

## Schema

```json
{
  "type": "void",
  "name": "nocobase-mobile",
  "x-uid": "nocobase-mobile",
  "properties": {
    "pageOutlet": {
      "type": "void",
      "x-component": "MobilePageOutlet",
      "x-uid": "d1e6jk9sm1s",
      "x-async": false,
      "x-index": 1
    },
    "tabBar": {
      "x-uid": "ib20ma8464k",
      "type": "void",
      "x-component": "MobileTabBar",
      "x-decorator": "BlockItem",
      "x-decorator-props": {
        "style": {
          "position": "sticky",
          "bottom": 0
        }
      },
      "x-toolbar-props": {
        "draggable": false
      },
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "x-async": false,
      "x-index": 2,
      "x-component-props": {
        "enableTabBar": true
      }
    }
  },
  "x-async": false
}
```

其中核心是 `MobilePageOutlet` 和 `MobileTabBar` 两个组件。


## MobilePageOutlet

此组件功能较为简单，即使用 `react-router-dom` 的 `Outlet` 组件渲染子路由。

除此之外，其设置了 `minHeight` 为 `calc(100% - ${NavigationBarHeight}px)`，让其撑开页面。

## MobileTabBar

页面底部的 `TabBar`。

<code src="../demos/MobileTabBar-basic.tsx"></code>

### 类型

```ts
interface MobileTabBarProps {
  /**
   * @default true
   */
  enableTabBar?: boolean;
}
```

- `enableTabBar`：如果值为 `false`，则不渲染。

### Examples

- `enableTabBar`：`false`

会隐藏 `TabBar`。

```json
"x-component-props": {
  "enableTabBar": false,
}
```

<code src="../demos/MobileTabBar-false.tsx"></code>

- 内页会自定隐藏

如果是内页，会自动隐藏 `TabBar`。

<code src="../demos/MobileTabBar-inner-page.tsx"></code>

### Initializer

TODO

<!-- <code src="../demos/MobileTabBar-initializer.tsx"></code> -->

## MobileTabBar.Item

基础的 `TabBar.Item`，一般被其他特殊的 `TabBar.Item` 继承，例如 `MobileTabBar.Page` 和 `MobileTabBar.Link`。


### 类型

```ts
interface MobileTabBarItemProps {
  // 图标
  icon?: string;
  // 选中时的图标
  selectedIcon?: string;
  // 标题
  title?: string;
  // 点击事件
  onClick?: () => void;
  // 是否选中
  selected?: boolean;
  // 是否显示徽标
  badge?: number | string | boolean;
}
```

### Examples

#### Basic

<code src="../demos/MobileTabBar.Item-basic.tsx"></code>

#### With Icon

- icon: string

<code src="../demos/MobileTabBar.Item-with-icon.tsx"></code>

- icon: React.Node

<code src="../demos/MobileTabBar.Item-with-icon-node.tsx"></code>

#### Selected

<code src="../demos/MobileTabBar.Item-selected.tsx"></code>

#### Selected Icon

<code src="../demos/MobileTabBar.Item-selected-icon.tsx"></code>

#### onClick

<code src="../demos/MobileTabBar.Item-on-click.tsx"></code>

## MobileTabBar.Page

用于渲染和创建 Schema 页面的 `TabBar.Item`。

其继承自 `MobileTabBar.Item`，并自定义了 `onClick` 事件，添加了 `pageSchemaId` 属性。

其点击效果是跳转到 `/page/${pageSchemaId}` 页面。

### Examples

#### Basic

<code src="../demos/MobileTabBar.Page-basic.tsx"></code>

#### selected

<code src="../demos/MobileTabBar.Page-selected.tsx"></code>

### Schema

<code src="../demos/MobileTabBar.Page-schema.tsx"></code>

### Settings

<code src="../demos/MobileTabBar.Page-settings.tsx"></code>


## MobileTabBar.Link

用于渲染外部链接的 `TabBar.Item`。

其继承自 `MobileTabBar.Item`，并自定义了 `onClick` 事件，添加了 `link` 属性。

其点击效果是跳转到 `link` 页面。

### Examples

#### inner link

<code src="../demos/MobileTabBar.Link-inner.tsx"></code>

#### outer page

<code src="../demos/MobileTabBar.Link-outer.tsx"></code>

#### selected

<code src="../demos/MobileTabBar.Link-selected.tsx"></code>

### Schema

<code src="../demos/MobileTabBar.Link-schema.tsx"></code>

### Settings

<code src="../demos/MobileTabBar.Link-settings.tsx"></code>
