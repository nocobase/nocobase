:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng các thẻ cấu hình quyền

Dưới đây, chúng ta sẽ lấy mục cấu hình "Mobile Menu" làm ví dụ để minh họa cách mở rộng một thẻ cấu hình quyền mới. Kết quả được hiển thị trong hình dưới đây:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Mã code như sau:

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

Đầu tiên, chúng ta cần lấy một instance của plugin `PluginACLClient` ([các phương pháp khác để lấy instance của plugin](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)), và thêm một thẻ cấu hình quyền mới bằng phương thức `settingsUI.addPermissionsTab`. Trong ví dụ này, chúng ta đã thêm một thẻ cấu hình quyền có tên là "Mobile Menu".

Giá trị của thuộc tính `settingsUI` là một instance của lớp có tên `ACLSettingsUI`, và thông tin kiểu của nó như sau:

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