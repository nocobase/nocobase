# Settings Center

<img src="./settings-tab.jpg" style="max-width: 100%;"/>

## 示例

```tsx | pure
import { SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';

const HelloTab => () => <div>Hello Tab</div>;

export default React.memo((props) => {
  return (
    <SettingsCenterProvider
      settings={{
        'sample-hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello Tab',
              component: HelloTab,
            },
          },
        },
      }}
    >{props.children}</SettingsCenterProvider>
  );
});
```

完整示例查看 [samples/hello](https://github.com/nocobase/nocobase/tree/develop/packages/samples/hello)。