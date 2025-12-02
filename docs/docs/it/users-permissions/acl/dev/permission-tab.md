:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Estendere le schede di configurazione dei permessi

Prendiamo come esempio la voce di configurazione "Menu mobile" per dimostrare come estendere una nuova scheda di configurazione dei permessi. Il risultato è illustrato nell'immagine seguente:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Ecco il codice:

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

Innanzitutto, dobbiamo ottenere un'istanza del `plugin` `PluginACLClient` ([altri metodi per ottenere istanze di plugin](/plugin-development/client/plugin#get-plugin-instance)) e aggiungere una nuova scheda di configurazione dei permessi utilizzando il metodo `settingsUI.addPermissionsTab`. In questo esempio, abbiamo aggiunto una scheda di configurazione dei permessi chiamata "Menu mobile".

Il valore della proprietà `settingsUI` è un'istanza di una classe chiamata `ACLSettingsUI`, e le sue informazioni sul tipo sono riportate di seguito:

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
   * la chiave del pannello della scheda attualmente attivo
   */
  activeKey: string;
  /**
   * il ruolo attualmente selezionato
   */
  role: Role;
  /**
   * funzione di traduzione
   */
  t: TFunction;
  /**
   * utilizzato per limitare le dimensioni del contenitore nella scheda
   */
  TabLayout: React.FC;
}
```