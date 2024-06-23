# Client

<code src="./demos/Demo.tsx"></code>

## 嵌套关系

```tsx | pure
<Mobile> //  提供各种 Providers 和 Routes
  <MobileProviders>
    <Routers>
      <MobileLayout> // react-router 最顶部路由的 Layout `router.add('mobile', {  Component: 'MobileLayout'  })`
        <Outlet /> // 自定义的路由组件
        <MobileTabBar />
      </MobileLayout>
    </Routes>
  </MobileProviders>
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

```

## Schema

## Schema


```ts

```

## 待确定的事或者有争议的事



## 待做任务



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

- 如果 TabBar 单独设置，则需要单独存储配置的东西，他不是 Schema（当然也可以没有设置，显示与否用是否有子项，其他的背景或者颜色之类的如果不需要设置的话）
- 从过 tab 创建 Schema 需要一个根节点（mobile）
- 2 种 TabBar Item 的 Schema 定义方式
- 完全自定义的 TabBar Item，例如闲鱼的 【发布闲置】 按钮
- 主题
- 子系统
- 响应式 ipad、mobile
- 删除 items 的时候，是否需要删除对应的 Schema
- packages/presets/nocobase/src/server/index.ts
- 配置解决是否需要 /mobile？以及配置界面样子描述（链接点击跳转到单独的配置节目还是嵌入）
- Schema 的 name 到底是具体的名字好，还是 Uid() 好
- 搜索/tabs 下面放 initailzer 或者 settings，还是坚持放上面？
- 预览、JS briage

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

