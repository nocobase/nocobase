:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# توسيع علامات تبويب إعدادات الأذونات

فيما يلي مثال على عنصر إعداد "قائمة الجوال" (Mobile Menu)، يوضح كيفية توسيع علامة تبويب جديدة لإعدادات الأذونات. يظهر التأثير في الشكل أدناه:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

الرمز البرمجي هو كما يلي:

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

أولاً، نحتاج إلى الحصول على نسخة (instance) من إضافة `PluginACLClient` ([طرق أخرى للحصول على نسخ الإضافات](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6))، ثم إضافة علامة تبويب جديدة لإعدادات الأذونات باستخدام الدالة `settingsUI.addPermissionsTab`. في هذا المثال، أضفنا علامة تبويب لإعدادات الأذونات باسم "قائمة الجوال" (Mobile Menu).

قيمة الخاصية `settingsUI` هي نسخة (instance) من فئة (class) تسمى `ACLSettingsUI`، ومعلومات نوعها (type information) هي كما يلي:

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