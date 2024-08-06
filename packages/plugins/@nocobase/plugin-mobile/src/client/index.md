# Client

## 目录

- `providers`：主应用的 providers
- `mobile-providers`：移动端内置的 `providers`
  - `context`：mobile 的全局上下文
    - `mobileTitle`：用于设置 mobile title
    - `mobileRoutes`：增删改查移动端路由
  - `MobileProviders`：组件
    - `AdminProvider`
    - `MobileTitleProvider` 对应上面的 `mobileTitle`
    - `MobileRoutesProvider` 对应上面的 `mobileRoutes`
- `desktop-mode`：桌面模式
- `js-bridge`：JS Bridge
- `mobile`：移动端入口组件，主要是渲染移动端 `Routes`
  - `MobileAppContext`：移动端全局上下文
- `mobile-layout`：移动端 Layout
  - `MobilePageOutlet`：页面内容区域
  - `mobile-tab-bar`：底部 TabBar
    - `MobileTabBar`：组件
    - `types`：内置的 TabBar 类型
      - `MobileTabBar.Link`：链接类型
      - `MobileTabBar.Page`：Page 类型
    - `MobileTabBar.Item`：基础 Item，供其他类型继承
- `pages`：页面
  - `not-found`：404 页面
  - `home`: `/` 页面
  - `dynamic-page`：动态 schema 页面
    - `MobilePage`：读取 URL 中 uid，渲染页面
      - `header`：`MobilePageHeader`：页面头部
        - `navigationBar`：`MobilePageNavigationBar`：页面导航栏
          - `actions`：内置的 actions
            - `link`：链接
        - `tabs`：`MobilePageTabs`：页面 Tabs
      - `content`：`MobilePageContent`：页面内容区域

## 嵌套关系

### 全局嵌套关系

```tsx | pure
<Mobile> // 渲染移动端 Routes
  <MobileAppContext>
    <MobileRouter>
      <MobileLayout> // 提供移动端上下文和布局
        <MobileProviders>
          <RemoteSchemaComponent uid='nocobase-mobile'>
            <MobilePageOutlet /> // 页面内容
            <MobileTabBar /> // 底部 TabBar
          </RemoteSchemaComponent>
        </MobileProviders>
      </MobileLayout>
    </MobileRouter>
  </MobileAppContext>
</Mobile>
```

```tsx | pure
// 首先是将 `/mobile` 路由添加根项目的路由中，这样所有访问 `/mobile` 的请求都会进入到 mobile 路由中
app.router.add('mobile', {
  path: '/mobile/*',
  element: <Mobile />,
});
```

```tsx | pure
// 匹配 Layout，这样默认情况下所有页面都是 <MobileLayout><Outlet /><MobileTabBar /></</MobileLayout>
mobileRouter.add('mobile', {
  element: <MobileLayout />,
});
```

### 动态 schema 页面的嵌套关系

```tsx | pure
<MobilePage> // react-router 匹配的 Schema 页面 router.add('/page/:pageSchemaUid', { Component: 'MobilePage' })
  <RemoteSchemaComponent uid={params.pageSchemaUid}> // 通过 URL 获取 uid，加载整个页面的 Schema
    <MobilePageProvider> // 提供页面级别的上下文
      <MobilePageHeader > // 顶部
        <MobilePageNavigationBar /> // 页面导航栏
        <MobilePageTabs /> // 页面 Tabs
      </MobilePageHeader>
      <MobilePageContent> // 页面内容区
        <RemoteSchemaComponent uid={params.tabSchemaId} /> // `/page/:pageSchemaUid/tabs/:tabSchemaUid` 读取 `tabSchemaUid` 渲染对应的 Tab 页面
      </MobilePageContent>
    </MobilePageProvider>
  </RemoteSchemaComponent>
</MobilePage>
```

```tsx | pure
// schema 页面路由
mobileRouter.add('mobile.schema.page', {
  path: '/page/:pageSchemaUid',
  Component: 'MobilePage',
});

// Tab 路由
mobileRouter.add('mobile.schema.tabs.page', {
  path: '/page/:pageSchemaUid/tabs/:tabSchemaUid',
  Component: 'MobilePage',
});
```

## 路由接口

```ts
export interface MobileRouteItem {
  id: number;
  schemaUid?: string;
  type: 'page' | 'link' | 'tabs';
  options: any;
  title?: string;
  icon?: string;
  parentId?: number;
  children?: MobileRouteItem[];
}
```

对于 `TabBar` 而言，`options` 是 `MobileRouteItem` 对应的 `schema`。
对于 `Tabs` 而言，`options` 只要是存着对应的页面 `schemaUid` 和 `title`。

```json
[
  {
      "id": 10,
      "parentId": null,
      "title": "Test1",
      "icon": "AppstoreOutlined",
      "schemaUid": "d4o6esth2ik",
      "type": "page",
      "options": null,
      "sort": 1,
      "children": [
          {
              "id": 11,
              "parentId": 10,
              "title": "Tab1",
              "icon": null,
              "schemaUid": "pm65m9y0o2y",
              "type": "tabs",
              "options": null,
              "sort": 2,
              "__index": "0.children.0"
          },
          {
              "id": 12,
              "parentId": 10,
              "title": "Tab2",
              "icon": null,
              "schemaUid": "1mcth1tfcb6",
              "type": "tabs",
              "options": null,
              "sort": 3,
              "__index": "0.children.1"
          }
      ],
      "__index": "0"
  },
  {
      "id": 13,
      "parentId": null,
      "title": "Test2",
      "icon": "aliwangwangoutlined",
      "schemaUid": null,
      "type": "link",
      "options": {
          "schemaUid": null,
          "url": "https://github.com",
          "params": [
              {}
          ]
      },
      "sort": 4,
      "__index": "1"
  }
]
```

## Schema


### MobileTabBarItem Schema

```ts
function getMobileTabBarItemSchema(routeItem: MobileRouteItem) {
  return {
    name: routeItem.id,
    type: 'void',
    'x-decorator': 'BlockItem',
    'x-settings': `mobile:tab-bar:${routeItem.type}`,
    'x-component': `MobileTabBar.${upperFirst(routeItem.type)}`,
    'x-toolbar-props': {
      showBorder: false,
      showBackground: true,
    },
    'x-component-props': {
      title: routeItem.title,
      icon: routeItem.icon,
      schemaUid: routeItem.schemaUid,
      ...(routeItem.options || {}),
    },
  }
}
```

#### `page` type：

```ts
{
  name: 1,
  type: 'void',
  'x-decorator': 'BlockItem',
  'x-settings': `mobile:tab-bar:page`,
  'x-component': `MobileTabBar.Page`,
  'x-toolbar-props': {
    showBorder: false,
    showBackground: true,
  },
  'x-component-props': {
    title: 'Test',
    icon: 'AppstoreOutlined',
    schemaUid: 'd4o6esth2ik',
  },
}
```

#### `link` type：

```ts
{
  name: 1,
  type: 'void',
  'x-decorator': 'BlockItem',
  'x-settings': `mobile:tab-bar:link`,
  'x-component': `MobileTabBar.Link`,
  'x-toolbar-props': {
    showBorder: false,
    showBackground: true,
  },
  'x-component-props': {
    title: 'Test',
    icon: 'AppstoreOutlined',
    schemaUid: 'd4o6esth2ik',
    url: 'https://github.com',
  },
}
```

### Page Schema

```json
{
  "type": "void",
  "name": "schema",
  "x-uid": "page1",
  "x-component": "MobilePageProvider",
  "x-settings": "mobile:page",
  "x-decorator": "BlockItem",
  "x-decorator-props": {
    "style": {
      "height": "100%"
    }
  },
  "x-toolbar-props": {
    "draggable": false,
    "spaceWrapperStyle": {
      "right": -15,
      "top": -15
    },
    "spaceClassName": "css-m1q7xw",
    "toolbarStyle": {
      "overflowX": "hidden"
    }
  },
  "properties": {
    "header": {
      "type": "void",
      "x-component": "MobilePageHeader",
      "properties": {
        "pageNavigationBar": {
          "type": "void",
          "x-component": "MobilePageNavigationBar",
          "properties": {
            "actionBar": {
              "type": "void",
              "x-component": "MobileNavigationActionBar",
              "x-initializer": "mobile:navigation-bar:actions",
              "x-component-props": {
                "spaceProps": {
                  "style": {
                    "flexWrap": "nowrap"
                  }
                }
              },
              "name": "actionBar"
            }
          },
          "name": "pageNavigationBar"
        },
        "pageTabs": {
          "type": "void",
          "x-component": "MobilePageTabs",
          "name": "pageTabs"
        }
      },
      "name": "header"
    },
    "content": {
      "type": "void",
      "x-component": "MobilePageContent",
      "properties": {
        "tab1": {
          "type": "void",
          "x-uid": "tab1",
          "x-async": true,
          "x-component": "Grid",
          "x-initializer": "mobile:addBlock",
          "name": "tab1"
        },
        "tab2": {
          "type": "void",
          "x-uid": "tab2",
          "x-async": true,
          "x-component": "Grid",
          "x-initializer": "mobile:addBlock",
          "name": "tab2"
        }
      },
      "name": "content"
    }
  }
}
```

其中 `tab1` 和 `tab2` 的 `x-async` 为 true，表示是异步加载的。
