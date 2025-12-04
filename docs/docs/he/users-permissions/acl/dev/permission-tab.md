:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת לשוניות תצורת הרשאות

להלן נדגים, באמצעות פריט התצורה "תפריט מובייל", כיצד להרחיב לשונית תצורת הרשאות חדשה. התוצאה מוצגת בתמונה הבאה:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

הקוד הבא:

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

ראשית, עלינו לקבל מופע של תוסף ה-`PluginACLClient` ([שיטות נוספות לקבלת מופעי תוספים](/plugin-development/client/plugin#get-plugin-instance)). לאחר מכן, נוסיף לשונית תצורת הרשאות חדשה באמצעות מתודת ה-`settingsUI.addPermissionsTab`. בדוגמה זו, הוספנו לשונית תצורת הרשאות בשם "תפריט מובייל".

הערך של מאפיין ה-`settingsUI` הוא מופע של מחלקה בשם `ACLSettingsUI`, ומידע הטיפוס שלה מוצג להלן:

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