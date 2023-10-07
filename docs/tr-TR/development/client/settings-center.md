# Settings Center

<img src="./settings-center/settings-tab.jpg" style="max-width: 100%;"/>

## Example

```tsx | pure
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add('hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: HelloSettingPage,
    })
  }
}
```

See [samples/hello](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-sample-hello/src/client/index.tsx) for full examples.
