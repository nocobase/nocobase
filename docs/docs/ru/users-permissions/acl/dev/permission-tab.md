# Расширение вкладок конфигурации прав

Ниже приведён пример элемента конфигурации «Мобильное меню», демонстрирующий, как расширить новую вкладку конфигурации прав. Результат показан на рисунке ниже:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Код:

```typescript
import { Plugin } from '@nocobase/client';
import PluginACLClient from '@nocobase/plugin-acl/client';

class PluginMobileClient extends Plugin {
  async load() {
    const aclInstance = this.app.pm.get(PluginACLClient);

    aclInstance?.settingsUI.addPermissionsTab(({ t, TabLayout, activeKey }) => ({
      key: 'mobile-menu',
      label: t('Мобильное меню', {
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

Сначала нужно получить экземпляр плагина `PluginACLClient` ([другие способы получения экземпляра плагина](/plugin-development/client/plugin#get-plugin-instance)), а затем добавить новую вкладку конфигурации прав с помощью метода `settingsUI.addPermissionsTab`. В этом примере добавлена вкладка конфигурации прав с именем «Мобильное меню».

Значение свойства `settingsUI` — экземпляр класса `ACLSettingsUI`, информация о типах:

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
   * ключ текущей активной панели вкладок
   */
  activeKey: string;
  /**
   * текущая выбранная роль
   */
  role: Role;
  /**
   * функция перевода
   */
  t: TFunction;
  /**
   * используется для ограничения размера контейнера во вкладке
   */
  TabLayout: React.FC;
}
```