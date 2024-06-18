# Client


<code src="./demos/Demo.tsx"></code>

## Schema

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

