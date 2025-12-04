:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka behörighetsflikar

Nedan ser ni ett exempel på konfigurationsobjektet "Mobilmeny", som visar hur ni utökar en ny behörighetsflik. Resultatet visas i bilden nedan:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Koden ser ut så här:

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

Först behöver ni hämta en instans av `PluginACLClient`-pluginen ([andra sätt att hämta plugin-instanser](/plugin-development/client/plugin#get-plugin-instance)), och lägga till en ny behörighetsflik med hjälp av metoden `settingsUI.addPermissionsTab`. I det här exemplet har vi lagt till en behörighetsflik som heter "Mobilmeny".

`settingsUI`-egenskapens värde är en instans av en klass som heter `ACLSettingsUI`, och dess typinformation ser ut så här:

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
   * nyckeln för den för närvarande aktiva flikpanelen
   */
  activeKey: string;
  /**
   * den för närvarande valda rollen
   */
  role: Role;
  /**
   * översättningsfunktion
   */
  t: TFunction;
  /**
   * används för att begränsa storleken på behållaren i fliken
   */
  TabLayout: React.FC;
}
```