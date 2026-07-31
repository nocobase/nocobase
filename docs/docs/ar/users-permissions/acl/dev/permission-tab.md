# توسيع تبويبات إعداد الصلاحيات

فيما يلي مثال لعنصر إعداد "القائمة المحمولة" (Mobile Menu)، يوضّح كيفية إضافة تبويب جديد لإعداد الصلاحيات. يظهر التأثير في الصورة أدناه:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

الكود كما يلي:

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

أولاً، نحتاج إلى الحصول على نسخة (instance) من إضافة `PluginACLClient` ([طرق أخرى للحصول على نسخ الإضافات](/plugin-development/client/plugin#get-plugin-instance))، ثم نضيف تبويبًا جديدًا لإعداد الصلاحيات باستخدام الدالة `settingsUI.addPermissionsTab`. في هذا المثال، قمنا بإضافة تبويب إعداد صلاحيات باسم "Mobile Menu".

قيمة الخاصية `settingsUI` هي نسخة من كلاس يُسمى `ACLSettingsUI`، ومعلومات النوع الخاصة به كما يلي:

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
   * مفتاح (key) التبويب النشط حاليًا
   */
  activeKey: string;
  /**
   * الدور (role) المحدد حاليًا
   */
  role: Role;
  /**
   * دالة الترجمة
   */
  t: TFunction;
  /**
   * يُستخدم لتقييد حجم الحاوية داخل التبويب
   */
  TabLayout: React.FC;
}
```
