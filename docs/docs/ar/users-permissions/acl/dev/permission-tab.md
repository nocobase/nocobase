# توسيع تبويبات تهيئة الصلاحيات

فيما يلي مثال على عنصر تهيئة "قائمة الجوال"، يوضح كيفية توسيع تبويب تهيئة صلاحيات جديد.

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

الكود كالتالي:

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

أولاً، نحتاج إلى الحصول على نسخة من إضافة `PluginACLClient`، وإضافة تبويب تهيئة صلاحيات جديد باستخدام طريقة `settingsUI.addPermissionsTab`. في هذا المثال، أضفنا تبويب تهيئة صلاحيات باسم "قائمة الجوال".

قيمة خاصية `settingsUI` هي نسخة من فئة تُسمى `ACLSettingsUI`، ومعلومات نوعها كالتالي:

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
   * مفتاح لوحة التبويب النشطة حالياً
   */
  activeKey: string;
  /**
   * الدور المحدد حالياً
   */
  role: Role;
  /**
   * دالة الترجمة
   */
  t: TFunction;
  /**
   * تُستخدم لتقييد حجم الحاوية في التبويب
   */
  TabLayout: React.FC;
}
```
