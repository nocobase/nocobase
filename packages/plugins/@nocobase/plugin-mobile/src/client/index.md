# Client

## 目录

- `providers`：主应用的 providers
  - `MobileCheckerProvider`：如果当前路径为 `/admin` 且是移动端，则跳转到 `/mobile` ？
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
- `mobile`：移动端入口组件，主要是渲染 `Routes`
  - `<DesktopMode>
      <RouterComponent /> // 移动端路由实例
    </DesktopMode>`
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
      - `content`：`MobilePageContent`：页面内容区域
      - `navigationBar`：`MobilePageNavigationBar`：页面导航栏
        - `actions-initializer`：内置的 actions
          - `link`：链接

## 嵌套关系


### 全局嵌套关系

```tsx | pure
<Mobile> // 主要作用：渲染 Routes
  <Routers>
    <MobileLayout> // 主要作用：提供移动端上下文和布局
      <MobileProviders>
        <MobilePageOutlet /> // 主要的页面内容
        <MobileTabBar />
      </MobileProviders>
    </MobileLayout>
  </Routes>
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
<MobilePage> // react-router 匹配的 Schema 页面 router.add('/schema/:schemaPageUid', { Component: 'MobilePage' })
  <RemoteSchemaComponent uid={params.schemaPageUid}> // 通过 URL 获取 uid，加载整个页面的 Schema
    <MobilePageProvider> // 提供页面级别的上下文
      <MobilePageNavigationBar /> // 顶部导航栏
      <MobilePageContent> // 页面内容区
        <RemoteSchemaComponent uid={params.tabSchemaId} /> // `/schema/:schemaPageUid/tabs/:tabSchemaUid` 读取 `tabSchemaUid` 渲染对应的 Tab 页面
      </MobilePageContent>
    </MobilePageProvider>
  </RemoteSchemaComponent>
</MobilePage>
```

```tsx | pure
// schema 页面路由
mobileRouter.add('mobile.schema.page', {
  path: '/schema/:schemaPageUid',
  Component: 'MobilePage',
});


// Tab 路由
mobileRouter.add('mobile.schema.tabs.page', {
  path: '/schema/:schemaPageUid/tabs/:tabSchemaUid',
  Component: 'MobilePage',
});
```

## 路由接口

```ts
// 核心是 URL 和 options
export interface TabBarItem {
  id: number;
  url?: string;
  options: ISchema;
  parentId?: number;
  children?: TabItem[];
}

// 核心是 URL 和 options
export interface TabItem {
  id: number;
  url?: string;
  options: { title: string; schemaPageUid: string };
  parentId?: number;
}
```

为了统一 Schema 链接和普通的 URL 链接，我们都将 `url` 放到了最外层，这样方便查找和匹配。

```json
[
    {
        "id": 3,
        "parentId": null,
        "url": "/schema/3bz0ki59s8f",
        "options": {
            "type": "void",
            "x-decorator": "BlockItem",
            "x-toolbar-props": {
                "draggable": false
            },
            "x-settings": "mobile:tab-bar:schema",
            "x-component": "MobileTabBar.Page",
            "x-component-props": {
                "title": "Home",
                "icon": "alipayoutlined",
                "selectedIcon": "alipaycircleoutlined",
                "schemaPageUid": "3bz0ki59s8f"
            }
        },
        "children": [
            {
                "id": 4,
                "parentId": 3,
                "url": "/schema/3bz0ki59s8f/tabs/aql952klkmw",
                "options": {
                    "title": "Unnamed",
                    "tabSchemaId": "aql952klkmw"
                },
                "__index": "0.children.0"
            }
        ],
        "__index": "0"
    },
    {
        "id": 5,
        "parentId": null,
        "url": "/schema/e3t0g3kql0u",
        "options": {
            "type": "void",
            "x-decorator": "BlockItem",
            "x-toolbar-props": {
                "draggable": false
            },
            "x-settings": "mobile:tab-bar:schema",
            "x-component": "MobileTabBar.Page",
            "x-component-props": {
                "title": "Message",
                "icon": "aliwangwangoutlined",
                "schemaPageUid": "e3t0g3kql0u"
            }
        },
        "children": [
            {
                "id": 6,
                "parentId": 5,
                "url": "/schema/e3t0g3kql0u/tabs/5av5oolwlve",
                "options": {
                    "title": "未读消息",
                    "schemaPageUid": "5av5oolwlve"
                },
                "__index": "1.children.0"
            },
            {
                "id": 8,
                "parentId": 5,
                "url": "/schema/e3t0g3kql0u/tabs/2w3k326y33n",
                "options": {
                    "title": "已读消息",
                    "schemaPageUid": "2w3k326y33n"
                },
                "__index": "1.children.1"
            }
        ],
        "__index": "1"
    },
    {
        "id": 7,
        "parentId": null,
        "url": null,
        "options": {
            "_isJSONSchemaObject": true,
            "version": "2.0",
            "name": "7",
            "type": "void",
            "x-decorator": "BlockItem",
            "x-toolbar-props": {
                "draggable": false
            },
            "x-settings": "mobile:tab-bar:link",
            "x-component": "MobileTabBar.Link",
            "x-component-props": {
                "title": "Github",
                "link": "https://github.com",
                "icon": "githuboutlined"
            }
        },
        "__index": "2"
    }
]
```

## Schema

## 入口 schema

```json
{
    "type": "void",
    "name": "nocobase-mobile",
    "x-uid": "nocobase-mobile",
    "properties": {
        "pageOutlet": {
            "type": "void",
            "x-component": "MobilePageOutlet",
        },
        "tabBar": {
            "type": "void",
            "x-component": "MobileTabBar",
            "x-decorator": "BlockItem",
            "x-decorator-props": {
                "style": {
                    "position": "sticky",
                    "bottom": 0
                }
            },
            "x-settings": "mobile:tab-bar",
            "x-toolbar-props": {
                "draggable": false
            },
        }
    },
}
```

### TabBarItem Schema

```json
{
  "type": "void",
  "x-decorator": "BlockItem",
  "x-toolbar-props": {
      "draggable": false
  },
  "x-settings": "mobile:tab-bar:link",
  "x-component": "MobileTabBar.Link",
  "x-component-props": {
      "title": "Github",
      "link": "https://github.com",
      "icon": "githuboutlined"
  }
}
```

### Page Schema

```json
{
    "type": "void",
    "x-component": "MobilePageProvider",
    "x-settings": "mobile:page",
    "x-decorator": "BlockItem",
    "x-component-props": {
        "enableNavigationBarTabs": true
    },
    "properties": {
        "navigationBar": {
            "type": "void",
            "x-component": "MobilePageNavigationBar",
            "properties": {
                "type": "void",
                "x-component": "ActionBar",
                "x-initializer": "mobile:navigation-bar",
                "properties": {
                    "iaoxln0kidb": {
                      "x-position": "right",
                      "type": "void",
                      "x-component": "Action",
                      "x-toolbar": "ActionSchemaToolbar",
                      "x-settings": "mobile:navigation-bar:link",
                      "x-use-component-props": "useMobileNavigationBarLink",
                      "x-component-props": {
                          "link": "https://baidu.com",
                          "title": "Baidu",
                          "component": "MobileNavigationBarAction"
                      }
                    }
                },
            }
        },
        "content": {
            "type": "void",
            "x-component": "MobilePageContent",
            "properties": {
              "tab1": {
                  "type": "void",
                  "x-component": "Grid",
                  "x-async": true,
                  "x-initializer": "mobile:addBlock",
                  "properties": {}
              },
              "tab2": {
                  "type": "void",
                  "x-async": true,
                  "x-component": "Grid",
                  "x-initializer": "mobile:addBlock",
                  "properties": {}
              }
            }
        }
    }
}
```

其中 `tab1` 和 `tab2` 的 `x-async` 为 true，表示是异步加载的。

## 待确定的事或者有争议的事

- [x] 插件列表 presets 变更，怎么改？packages/presets/nocobase/src/server/index.ts
- [x] Settings 配置页面的样式和规划
  - [x] `basename` 是否需要可配置，如果不需要，则是一个链接，打开配置页面
  - [x] 如果需要配置，settings 配置页面按照原来的设计，还是独立的一个页面
- [x] 目前设计图中的 TabBar 类型只完成了 2 种类型，其他的类型是否这次做？先不做
- [x] 将 `navigationBar title` 是否显示，放到了 Page Settings 中，而不是 `navigationBar` 的设置中，`navigationBar` 没有设置项
- [x] Schema 的 name 到底是具体的名字，还是 Uid() 好
- [x] 删除 tabBar 的时候，是否关联的资源都删除，还是不用管？【尽量删】
- [x] `navigationBar` 左右两侧的 initializer 使用的是同一个，还是分开命名？【同一个】
- [x] TabBar 的需要设置吗？（目前看来没什么设置项，是否需要显示的问题，如果没注册到 TabBar 上则默认不显示，似乎是能满足要求的）
- [x] 明明没启用，为什么 PR 环境会默认安装 mobile-client 老的插件？
- [x] preset 中 `mobile-client 依赖` 是否删除，目前看如果删除，则原来的项目会报错（包不删）

- 功能：back 问题和内页，内页是没有 schema 的，所以想要自己实现页面直接使用原始的 navigateBar 就行了
- 功能：`navigationBar` 的操作按钮目前只实现了一个 Link，计划实现 `back`，其他的是否这次做？【自动处理，页面级别控制】（根据实际场景列举出来）
  - ActionSheet
  - 弹出层
- 代码设计：移动端是否需要自己的 providers manager ？是将 application 的抽象成 ProvidersManager 还是复制粘贴代码？
- 样式：内容区 padding/margin 是否需要，让其距离顶部和底部都有些距离？
- 样式：add block 需要添加哪些区块，还是空着？

- [x] `.Schema` -> `.Page`
- [x] 加排序字段
- [x] tabBar 拖拽
- [x] tabs 拖拽
- url 校验的问题
- 原 admin 弹窗改为子页面（等中合），back 等一起开发
- page 和 第一个区块覆盖的问题

## 待做任务

- [x] settings 页面
  - header 的样式？
- [x] tabBar 样式优化
- [x] navigationBar 样式优化
- [x] loading 效果
- [x] 响应式 ipad、mobile 效果都比较 OK
- [x] 多应用的支持
- [x] 404 页面
- [x] MobilePageNavigationBar Actions schema 处理
- [x] navigationBar Action 样式
- [x] 真机验证
- [x] 内容超过一屏幕，以及没有内容的情况
- [x] package.json & Readme 的描述
- [x] 主题色
- [-] JS bridge(没测)
- 多语言
- 各个部分的文档
- 更新文档
- unit test
- e2e test
- 新移动端 Tab 的插件开发示例
