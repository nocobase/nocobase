:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Extension des onglets de configuration des permissions

Voici un exemple, basé sur l'élément de configuration « Menu mobile », qui montre comment étendre un nouvel onglet de configuration des permissions. Le résultat est illustré ci-dessous :

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Voici le code :

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

Tout d'abord, nous devons obtenir une instance du plugin `PluginACLClient` ([autres méthodes pour obtenir des instances de plugin](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)), puis ajouter un nouvel onglet de configuration des permissions à l'aide de la méthode `settingsUI.addPermissionsTab`. Dans cet exemple, nous avons ajouté un onglet de configuration des permissions nommé « Menu mobile ».

La propriété `settingsUI` est une instance de la classe `ACLSettingsUI`. Voici ses informations de type :

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
   * Clé du panneau d'onglet actuellement actif
   */
  activeKey: string;
  /**
   * Rôle actuellement sélectionné
   */
  role: Role;
  /**
   * Fonction de traduction
   */
  t: TFunction;
  /**
   * Utilisé pour contraindre la taille du conteneur dans l'onglet
   */
  TabLayout: React.FC;
}
```