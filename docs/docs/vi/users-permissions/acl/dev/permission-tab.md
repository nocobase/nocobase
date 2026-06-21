---
pkg: '@nocobase/plugin-acl'
title: "Mở rộng tab cấu hình quyền"
description: "Plugin ACL NocoBase mở rộng tab cấu hình quyền: addPermissionsTab, TabLayout, tab quyền tùy chỉnh, lấy ví dụ với menu mobile."
keywords: "Mở rộng cấu hình quyền,addPermissionsTab,Tab quyền,phát triển ACL,quản lý quyền,NocoBase"
---

# Mở rộng tab cấu hình quyền

Dưới đây lấy mục cấu hình "Menu mobile" làm ví dụ để minh họa cách mở rộng một tab cấu hình quyền mới. Hiệu quả như hình bên dưới:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Code như sau:

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

Đầu tiên, chúng ta cần lấy instance của plugin `PluginACLClient` ([các phương thức khác để lấy plugin instance](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)), thông qua phương thức `settingsUI.addPermissionsTab` để thêm một tab cấu hình quyền mới. Trong ví dụ này, chúng ta đã thêm một tab cấu hình quyền có tên là "Menu mobile".

Giá trị của thuộc tính `settingsUI` là một instance của lớp có tên `ACLSettingsUI`, thông tin kiểu của nó như sau:

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
