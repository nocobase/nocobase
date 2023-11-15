# 配置中心

<img src="./plugin-settings/settings-tab.jpg" style="max-width: 100%;"/>

## 示例

### 基础用法

```tsx | pure
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('hello', {
      title: 'Hello',  // 设置页面的标题和菜单名称
      icon: 'ApiOutlined', // 设置页面菜单图标
      Component: HelloSettingPage,
    })
  }
}
```

### 多层级路由

```tsx | pure
import { Outlet } from 'react-router-dom'
const SettingPageLayout = () => <div>公共部分，下面是子路由的出口: <div><Outlet /></div></div>;

class HelloPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('hello', {
      title: 'HelloWorld', // 设置页面的标题和菜单名称
      icon: '', // 菜单图标
      Component: SettingPageLayout
    })

    this.app.pluginSettingsManager.add('hello.demo1', {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>
    })

    this.app.pluginSettingsManager.add('hello.demo2', {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>
    })
  }
}
```

### 获取路由路径


如果想获取设置页面的跳转链接，可以通过 `getRoutePath` 方法获取。

```tsx | pure
import { useApp } from '@nocobase/client'

const app = useApp();
app.pluginSettingsManager.getRoutePath('hello'); // /admin/settings/hello
app.pluginSettingsManager.getRoutePath('hello.demo1'); // /admin/settings/hello/demo1
```

### 获取配置

如果想获取添加的配置（已进行权限过滤），可以通过 `get` 方法获取。

```tsx | pure
const app = useApp();
app.pluginSettingsManager.get('hello'); // { title: 'HelloWorld', icon: '', Component: HelloSettingPage, children: [{...}] }
```

完整示例查看 [samples/hello](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-sample-hello/src/client/index.tsx)。
