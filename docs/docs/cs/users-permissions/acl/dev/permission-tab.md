:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření záložek konfigurace oprávnění

Níže si na příkladu konfigurační položky „Mobilní menu“ ukážeme, jak přidat novou záložku pro konfiguraci oprávnění. Výsledek je znázorněn na obrázku níže:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Zde je kód:

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

Nejprve potřebujeme získat instanci pluginu `PluginACLClient` ([další metody pro získání instancí pluginů](/plugin-development/client/plugin#get-plugin-instance)) a pomocí metody `settingsUI.addPermissionsTab` přidat novou záložku pro konfiguraci oprávnění. V tomto příkladu jsme přidali záložku pro konfiguraci oprávnění s názvem „Mobilní menu“.

Hodnota vlastnosti `settingsUI` je instance třídy `ACLSettingsUI`. Její typové informace jsou následující:

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
   * klíč aktuálně aktivního panelu záložky
   */
  activeKey: string;
  /**
   * aktuálně vybraná role
   */
  role: Role;
  /**
   * překladová funkce
   */
  t: TFunction;
  /**
   * slouží k omezení velikosti kontejneru v záložce
   */
  TabLayout: React.FC;
}
```