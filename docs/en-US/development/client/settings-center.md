# Settings Center

<img src="./settings-center/settings-tab.jpg" style="max-width: 100%;"/>

## Example

### Basic Usage

```tsx | pure
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add('hello', {
      title: 'Hello',  // menu title and page title
      icon: 'ApiOutlined', // menu icon
      component: HelloSettingPage,
    })
  }
}
```

### Multiple Level Routes

```tsx | pure
import { Outlet } from 'react-router-dom'
const SettingPageLayout = () => <div> <div>This</div> public part, the following is the outlet of the sub-route: <div><Outlet /></div></div>;

class HelloPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add('hello', {
      title: 'HelloWorld',
      icon: '',
      Component: SettingPageLayout
    })

    this.app.settingsCenter.add('hello.demo1', {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>
    })

    this.app.settingsCenter.add('hello.demo2', {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>
    })
  }
}
```

### Get Route Path

If you want to get the jump link of the setting page, you can get it through the `getRoutePath` method.

```tsx | pure
import { useApp } from '@nocobase/client'

const app = useApp();
app.settingsCenter.getRoutePath('hello'); // /admin/settings/hello
app.settingsCenter.getRoutePath('hello.demo1'); // /admin/settings/hello/demo1
```

### Get Config

If you want to get the added configuration (already filtered by permissions), you can get it through the `get` method.

```tsx | pure
const app = useApp();
app.settingsCenter.get('hello'); // { title: 'HelloWorld', icon: '', Component: HelloSettingPage, children: [{...}] }
```


See [samples/hello](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-sample-hello/src/client/index.tsx) for full examples.
