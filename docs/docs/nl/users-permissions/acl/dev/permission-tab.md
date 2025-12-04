:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Rechtenconfiguratietabbladen uitbreiden

Hieronder demonstreren we, aan de hand van het configuratie-item "Mobiel menu", hoe u een nieuw tabblad voor rechtenconfiguratie kunt uitbreiden. Het resultaat ziet u in de onderstaande afbeelding:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

De code ziet er als volgt uit:

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

Allereerst moeten we een instantie van de `PluginACLClient`-plugin verkrijgen ([andere methoden om plugin-instanties te verkrijgen](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)). Vervolgens voegen we een nieuw tabblad voor rechtenconfiguratie toe met behulp van de `settingsUI.addPermissionsTab`-methode. In dit voorbeeld hebben we een tabblad voor rechtenconfiguratie met de naam "Mobiel menu" toegevoegd.

De waarde van de `settingsUI`-eigenschap is een instantie van een klasse genaamd `ACLSettingsUI`. De type-informatie hiervan ziet er als volgt uit:

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