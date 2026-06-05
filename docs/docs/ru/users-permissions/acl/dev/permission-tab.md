:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Расширение вкладок конфигурации разрешений

Ниже мы рассмотрим пример элемента конфигурации «Мобильное меню», чтобы показать, как расширить новую вкладку настроек разрешений. Результат показан на изображении:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Код выглядит следующим образом:

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

Прежде всего, нам нужно получить экземпляр плагина `PluginACLClient` ([другие способы получения экземпляров плагинов](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)) и добавить новую вкладку настроек разрешений с помощью метода `settingsUI.addPermissionsTab`. В этом примере мы добавили вкладку настроек разрешений под названием «Мобильное меню».

Значение свойства `settingsUI` — это экземпляр класса `ACLSettingsUI`, а информация о его типе выглядит следующим образом:

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
   * ключ текущей активной панели вкладки
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