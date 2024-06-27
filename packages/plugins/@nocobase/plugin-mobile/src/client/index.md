# Client

<code src="./demos/Demo.tsx"></code>

## 嵌套关系

```tsx | pure
<Mobile> //  提供各种 Providers 和 Routes
  <Routers>
    <MobileLayout> // react-router 最顶部路由的 Layout `router.add('mobile', {  Component: 'MobileLayout'  })`
      <MobileProviders>
        <Outlet /> // 自定义的路由组件
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

```tsx | pure
<MobileSchemaPage> // react-router 匹配的 Schema 页面 router.add('/schema/:pageSchemaUid', { Component: 'MobileSchemaPage' })
  <RemoteSchemaComponent uid={params.pageSchemaUid}> // 通过 URL 获取 uid，加载整个页面的 Schema
    <MobilePage>
      <MobileNavigationBar />
      <MobileContent>
        <RemoteSchemaComponent uid={params.tabSchemaId} /> // Tab 的 Schema
      </MobileContent>
    </MobilePage>
  </RemoteSchemaComponent>
</MobileSchemaPage>
```

```tsx | pure
// schema 页面路由
mobileRouter.add('mobile.schema.page', {
  path: '/schema/:pageSchemaUid',
  Component: 'MobileSchemaPage',
});


// Tab 路由
mobileRouter.add('mobile.schema.tabs.page', {
  path: '/schema/:pageSchemaUid/tabs/:tabSchemaUid',
  Component: 'MobileSchemaPage',
});
```

## 路由数据

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
  options: { title: string; pageSchemaUid: string };
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
            "x-component": "MobileTabBar.Schema",
            "x-component-props": {
                "title": "Home",
                "icon": "alipayoutlined",
                "selectedIcon": "alipaycircleoutlined",
                "pageSchemaUid": "3bz0ki59s8f"
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
            "x-component": "MobileTabBar.Schema",
            "x-component-props": {
                "title": "Message",
                "icon": "aliwangwangoutlined",
                "pageSchemaUid": "e3t0g3kql0u"
            }
        },
        "children": [
            {
                "id": 6,
                "parentId": 5,
                "url": "/schema/e3t0g3kql0u/tabs/5av5oolwlve",
                "options": {
                    "title": "未读消息",
                    "pageSchemaUid": "5av5oolwlve"
                },
                "__index": "1.children.0"
            },
            {
                "id": 8,
                "parentId": 5,
                "url": "/schema/e3t0g3kql0u/tabs/2w3k326y33n",
                "options": {
                    "title": "已读消息",
                    "pageSchemaUid": "2w3k326y33n"
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
    "x-component": "MobilePage",
    "x-settings": "mobile:page",
    "x-decorator": "BlockItem",
    "x-component-props": {
        "enableNavigationBarTabs": true
    },
    "properties": {
        "navigationBar": {
            "type": "void",
            "x-component": "MobileNavigationBar",
            "properties": {
                "leftActions": {
                    "type": "void",
                    "x-component": "ActionBar",
                    "x-initializer": "mobile:navigation-bar",
                    "properties": {
                        "action1": {
                            "type": "void",
                            "x-align": "left|right|bottom|center",
                            "x-component": "Action",
                            "x-toolbar": "ActionSchemaToolbar",
                            "x-settings": "navigationBar:actionSettings:link",
                            "x-use-component-props": "useMobileNavigationBarLink",
                            "x-component-props": {
                                "link": "/",
                                "title": "Home",
                                "style": {
                                    "border": "none"
                                }
                            }
                        }
                    },
                },
                "rightActions": {
                    "type": "void",
                    "x-component": "ActionBar",
                    "x-initializer": "mobile:navigation-bar",
                }
            }
        },
        "content": {
            "type": "void",
            "x-component": "MobileContent",
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
- [-] Settings 配置页面的样式和规划
  - [x] `basename` 是否需要可配置，如果不需要，则是一个链接，打开配置页面
  - [x] 如果需要配置，settings 配置页面按照原来的设计，还是独立的一个页面
- [x] 目前设计图中的 TabBar 类型只完成了 2 种类型，其他的类型是否这次做？先不做
- [x] 将 `navigationBar title` 是否显示，放到了 Page Settings 中，而不是 `navigationBar` 的设置中，`navigationBar` 没有设置项
- [x] Schema 的 name 到底是具体的名字，还是 Uid() 好
- [x] 删除 tabBar 的时候，是否关联的资源都删除，还是不用管？【尽量删】
- back 问题和内页，内页是没有 schema 的，所以想要自己实现页面也需要自己写 navigateBar
- TabBar 的需要设置吗？（目前看来没什么设置项，是否需要显示的问题，如果没注册到 TabBar 上则默认不显示，似乎是能满足要求的）
- `navigationBar` 左右两侧的 initializer 使用的是同一个，还是分开命名？【同一个】
- `navigationBar` 的操作按钮目前只实现了一个 Link，计划实现 `back`，其他的是否这次做？【自动处理，页面级别控制】
  - ActionSheet
  - 弹出层
- 数据表字段是否需要预览一些字段？

## 待做任务

- [x] settings 页面
  - header 的样式？
- [x] tabBar 样式优化
- [x] navigationBar 样式优化
- [x] 主题色
- [x] loading 效果
- [x] 响应式 ipad、mobile 效果都比较 OK
- [x] 多应用的支持
- MobileNavigationBar Actions
- 404 页面
- JS bridge
- 真机演示，并且提示测试人员要多种机型测试
- 多语言
- 各个部分的文档
- package.json 的描述
- 更新文档
- Readme
- 新移动端 Tab 的插件开发示例


## Schema

```tsx | pure
{
 'x-component': 'MobilePage',
 'x-settings': 'MobilePage:settings',
 'properties': {
  'navigationBar': {
    'type': 'void',
    'x-component': 'MobileNavigationBar',
    'x-initializer': 'MobileNavigationBar:initializer',
    properties: {
    }
  },
  'content': {
    'type': 'void',
    'x-component': 'MobileContent',
  }
 }
}
```

## 问题


```js
{
  'x-component': 'Mobile',
  properties: {
    'content': {
      'x-component': 'MobilePage',
      'x-settings': 'MobilePage:settings',
      'properties': {
        'navigationBar': {
          'type': 'void',
          'x-component': 'MobileNavigationBar',
          'x-initializer': 'MobileNavigationBar:initializer',
          properties: {
            // 更多子项查看 ./navigation-bar/index.md
          }
        },
        'content': {
          'type': 'void',
          'x-component': 'MobileContent',
          'x-initializer': 'MobileContent:initializer',
          properties: {
            // 页面的区块（异步）
          }
        },
      }
    },
    'tabBar': {
      type: 'array',
      'x-component': 'MobileTabBar',
      'x-settings': 'MobileTabBar:settings',
      // 更多子项查看 ./tab-bar/index.md
    }
  }
}
```

![Mobile](https://res.wx.qq.com/wxdoc/dist/assets/img/config.344358b1.jpg)

需要说明的：

你之前的设计是：Header + Content + Footer，现在的设计是：Content（NavigationBar + Page） + TabBar。

核心原因是 Header 和 Footer 之间的关系是一对一的，而 TabBar 则是公共的。

## Components

### Mobile

全局样式以及提供上下文的作用。

```tsx ｜ pure
const Mobile = <MobileProviders>
  <Layout>
    <SchemaComponent scopes={{xxx}} components={{ xxx }} schema={schema} onlyProperties />
  </Layout>
</MobileProviders>
```

### MobileContent

页面内容区域。

```ts
interface MobileContentProps {
  backgroundColor?: string;
}
```

```tsx | pure
const MobileContent = ({ backgroundColor, children }) => {
  return <div style={{ backgroundColor }}>
    {settings}
    {children}
  </div>
}
```

#### MobileContent:settings

- `backgroundColor` 页面背景色
- `enable title` 是否启用标题（原设计图是放到 navbar 的 initializer 中）
- `enable navigationBar` 是否启用导航栏
- `enable navigationBar Tabs` 是否启用导航栏 Tabs

#### MobilePage

就是 `Add Block` 的页面。

