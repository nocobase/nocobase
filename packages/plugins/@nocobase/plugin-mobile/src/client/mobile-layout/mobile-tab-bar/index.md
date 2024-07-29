# Bottom

## Schema

```js
{
  type: 'array',
  'x-component': 'MobileTabBar',
  'x-component-props': {
    'defaultSelectedKey': 'tab1-schema',
  },
  'x-settings': 'MobileTabBar:settings',
  'x-initializer': 'MobileTabBar:initializer',
  items: {
    type: 'object',
    properties: {
      'tab1-schema': {
        type: 'void',
        'title': '首页',
        'x-decorator': 'MobileTabBar.Item',
        'x-component': 'MobileTabBar.Page',
        'x-component-props': {
          'icon': 'AppleOutlined',
          'selectedIcon': 'AppstoreOutlined',
          'pageSchemaId': 'home',
        },
        'x-link': '/page/home',
        'x-index': 1,
        'x-settings': 'MobileTabBar.Page:settings',
      },
      'tab2-schema': {
        type: 'void',
        'title': 'Message',
        'x-decorator': 'MobileTabBar.Item',
        'x-component': 'MobileTabBar.Page',
        'x-component-props': {
          'icon': 'MessageOutlined',
          'pageSchemaId': 'message',
        },
        'x-index': 2,
        'x-link': '/page/message',
        'x-settings': 'MobileTabBar.Page:settings',
      },
      'tab3-link': {
        type: 'void',
        'title': 'Github',
        'x-decorator': 'MobileTabBar.Item',
        'x-component': 'MobileTabBar.Link',
        'x-component-props': {
          'icon': 'GithubOutlined',
          'link': 'https://github.com',
        },
        'x-settings': 'MobileTabBar.Link:settings',
        'x-index': 3,
      },
      'tab4-link': {
        type: 'void',
        'title': 'My',
        'x-decorator': 'MobileTabBar.Item',
        'x-component': 'MobileTabBar.Link',
        'x-component-props': {
          'icon': 'GithubOutlined',
          'link': '/my',
        },<>
        'x-link': '/my',
        'x-settings': 'MobileTabBar.Link:settings',
        'x-index': 4,
      },
      'tab5-scan': {
        type: 'void',
        'title': 'Scan',
        'x-decorator': 'MobileTabBar.Item',
        'x-component': 'MobileTabBar.Scan',
        'x-component-props': {
          'icon': 'ScanOutlined',
        },
        'x-index': 5,
      },
    }
  }
}
```

其中关于 `x-link` 是用于判断是在 Tab 页面还是在内页，如果当前的 `pathname` 不等于不等于任何一个子项目的 `x-link` 值则隐藏。

## Components

### MobileTabBar 组件

移动端底部导航栏。

属性参考了：[小程序 TabBar](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#tabBar)

```ts
interface MobileTabBarProps {
  /**
   * 默认激活的 tab
   */
  defaultSelectedKey?: string;
  /**
   * tabBar 上的文字选中颜色
   * @default var(--adm-color-text-secondary)
   */
  color?: string;
  /**
   * tabBar 上的文字选中颜色
   * @default var(--adm-color-text-primary)
   */
  selectedColor?: string;
  /**
   * tabBar 的背景色
   */
  backgroundColor?: string;
  /**
   * tabBar 上边框的颜色
   * @default var(--adm-color-border)
   */
  borderColor?: string;
  /**
   * 是否显示 tabBar
   * @default true
   */
  visible?: boolean;
  /**
   * 是否固定在底部
   * @default true
   */
  fixed?: boolean;
}
```

这里并没有直接使用 ant-mobile 的 `TabBar` 组件，原因如下：

原因 1：因为 `TabBar` 和 `TabBar.Item` 之间不能有其他元素，导致无法增加 toolbar 这一层
原因 2：`TabBar.Item` 不够灵活，只能定义 `icon` 和 `title`，无法自定义

需要讨论的点：

- items 是数组还是对象？
- `MobileTabBar.Page` 这种点击后怎么联动到页面？
  - 链接从 `/mobile/:name` 改为 `/mobile/page/:name`：`/mobile/page/${pageSchemaId}` 读取 `params.pageSchemaId`
- 技术上，怎么操作 `items`？

### MobileTabBar.Item

基于 [BlockItem](https://client.docs.nocobase.com/components/block-item) 的扩展。

其继承了 BlockItem 的拖拽和 SchemaToolbar 和 SchemaSettings 的渲染功能。

未来可能有其他属性。

### MobileTabBar.Common

```ts
interface MobileTabBarCommonProps {
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

### MobileTabBar.Page

用于渲染 Schema 的 TabBar.Item。

```ts
interface MobileTabBarPageProps extends Omit<MobileTabBarCommonProps, 'onClick'> {
  // 页面的 schema id
  pageSchemaId: string;
}
```

当 `onClick` 时，会执行 `history.push` 到 `/mobile/${pageSchemaId}` 的页面。

### MobileTabBar.Link

用于渲染外部链接的 TabBar.Item。

```ts
interface MobileTabBarLinkProps extends Omit<MobileTabBarCommonProps, 'onClick'> {
  // 链接地址
  link: string;
}
```

当 `onClick` 时：

- 内部链接：执行 `history.push` 到 `link` 的页面。
- 外部链接：执行 `window.open` 到 `link` 的页面。

### MobileTabBar.Scan

用于渲染扫码的 TabBar.Item。

```ts
interface MobileTabBarScanProps extends Omit<MobileTabBarCommonProps, 'onClick'> {

}
```

当 `onClick` 时，会执行扫码的操作。

## Settings

### MobileTabBar:settings

### MobileTabBar.Page:settings

### MobileTabBar.Link:settings

### MobileTabBar.Scan:settings

## Initializer

### MobileTabBar:initializer
