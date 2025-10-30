# Extend Permission Configuration Tab

The following uses the "Mobile Menu" configuration item as an example to demonstrate how to extend a new permission configuration tab. The effect is shown in the figure below:


![20240903210248](https://static-docs.nocobase.com/20240903210248.png)


The code is as follows:

```typescript
import { Plugin } from '@nocobase/client';
import PluginACLClient from '@nocobase/plugin-acl/client';

class PluginMobileClient extends Plugin {
  async load() {
    const aclInstance = this.app.pm.get(PluginACLClient);

    aclInstance?.settingsUI.addPermissionsTab(({ t, TabLayout, activeKey }) => ({
      key: 'mobile-menu',
      label: t('Mobile menu', {
        ns: 'plugin-mobile',
      }),
      children: (
        <TabLayout>
          <MenuPermissions />
        </TabLayout>
      ),
    }));
  }
}
```

First, we need to get an instance of the `PluginACLClient` plugin ([Other ways to get a plugin instance](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)), and add a new permission configuration tab through the `settingsUI.addPermissionsTab` method. In this example, we added a permission configuration tab named "Mobile Menu".

The `settingsUI` property is an instance of the `ACLSettingsUI` class, with the following type information:

```typescript
import { TabsProps } from 'antd/es/tabs/index';

interface ACLSettingsUI {
  addPermissionsTab(tab: Tab | TabCallback): void;
  getPermissionsTabs(props: PermissionsTabsProps): Tab[];
}

type Tab = TabsProps['items'][0];

type TabCallback = (props: PermissionsTabsProps) => Tab;

interface PermissionsTabsProps {
  /**
   * the key of the currently active tab panel
   */
  activeKey: string;
  /**
   * the currently selected role
   */
  role: Role;
  /**
   * translation function
   */
  t: TFunction;
  /**
   * used to constrain the size of the container in the Tab
   */
  TabLayout: React.FC;
}
```