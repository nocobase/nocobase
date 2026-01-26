:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie zakładek konfiguracji uprawnień

Poniżej przedstawiono przykład elementu konfiguracji „Menu mobilne”, pokazujący, jak rozszerzyć nową zakładkę konfiguracji uprawnień. Efekt widoczny jest na poniższym obrazku:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Poniżej znajduje się kod:

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

Najpierw musimy uzyskać instancję wtyczki `PluginACLClient` ([inne metody uzyskiwania instancji wtyczek](/plugin-development/client/plugin#get-plugin-instance)), a następnie dodać nową zakładkę konfiguracji uprawnień za pomocą metody `settingsUI.addPermissionsTab`. W tym przykładzie dodaliśmy zakładkę konfiguracji uprawnień o nazwie „Menu mobilne”.

Wartość właściwości `settingsUI` jest instancją klasy o nazwie `ACLSettingsUI`, a jej informacje o typie przedstawiono poniżej:

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
   * klucz aktualnie aktywnego panelu zakładki
   */
  activeKey: string;
  /**
   * aktualnie wybrana rola
   */
  role: Role;
  /**
   * funkcja tłumaczenia
   */
  t: TFunction;
  /**
   * używane do ograniczenia rozmiaru kontenera w zakładce
   */
  TabLayout: React.FC;
}
```