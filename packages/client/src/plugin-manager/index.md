---
nav:
  path: /client
group:
  path: /client
---

# PluginManager

```tsx | pure
<PluginManager.Provider components={{
  CurrentUser,
  DesignableSwitch,
  CollectionManagerAction,
  ACLAction,
  SystemSettings,
}}>
  <PluginManager.Toolbar items={[
    {
      action: 'DesignableSwitch',
      pin: true,
    },
    {
      action: 'CollectionManagerAction',
      pin: true,
    },
    {
      action: 'ACLAction',
      pin: true,
    },
    {
      action: 'SystemSettings.Action',
    },
  ]}/>
</PluginManager.Provider>
```

## 扩展

如何扩展插件的 `PluginManager.Toolbar.Item`

```tsx | pure
import React from 'react';
import { Button, Menu } from 'antd';
import { HighlightOutlined } from '@ant-design/icons';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  return (
    <Menu.Item key={'DesignableSwitch'} eventKey={'DesignableSwitch'}>
      <HighlightOutlined />
    </Menu.Item>
  );
};
```