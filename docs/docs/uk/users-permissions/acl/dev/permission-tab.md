:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розширення вкладок налаштування дозволів

Нижче наведено приклад пункту налаштування "Мобільне меню", який демонструє, як розширити нову вкладку налаштування дозволів. Результат показано на зображенні нижче:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Код виглядає так:

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

Спершу нам потрібно отримати екземпляр плагіна `PluginACLClient` ([інші способи отримання екземплярів плагінів](/plugin-development/client/plugin#get-plugin-instance)) та додати нову вкладку налаштування дозволів за допомогою методу `settingsUI.addPermissionsTab`. У цьому прикладі ми додали вкладку налаштування дозволів під назвою "Мобільне меню".

Значення властивості `settingsUI` є екземпляром класу `ACLSettingsUI`, а його інформація про тип виглядає так:

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
   * ключ поточної активної панелі вкладки
   */
  activeKey: string;
  /**
   * поточна вибрана роль
   */
  role: Role;
  /**
   * функція перекладу
   */
  t: TFunction;
  /**
   * використовується для обмеження розміру контейнера у вкладці
   */
  TabLayout: React.FC;
}
```