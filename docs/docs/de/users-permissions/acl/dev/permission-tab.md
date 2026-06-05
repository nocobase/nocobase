:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Berechtigungs-Tabs erweitern

Im Folgenden wird am Beispiel des Konfigurationselements „Mobile Menü“ gezeigt, wie Sie einen neuen Berechtigungskonfigurations-Tab erweitern können. Das Ergebnis sehen Sie in der Abbildung unten:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Der Code sieht wie folgt aus:

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

Zuerst müssen wir eine Instanz des `PluginACLClient`-Plugins abrufen ([weitere Methoden zum Abrufen von Plugin-Instanzen](/plugin-development/client/plugin#get-plugin-instance)) und über die Methode `settingsUI.addPermissionsTab` einen neuen Berechtigungskonfigurations-Tab hinzufügen. In diesem Beispiel haben wir einen Berechtigungskonfigurations-Tab namens „Mobile Menü“ hinzugefügt.

Der Wert der Eigenschaft `settingsUI` ist eine Instanz einer Klasse namens `ACLSettingsUI`. Die zugehörigen Typinformationen sehen Sie im Folgenden:

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
   * Der Schlüssel des aktuell aktiven Tab-Panels
   */
  activeKey: string;
  /**
   * Die aktuell ausgewählte Rolle
   */
  role: Role;
  /**
   * Übersetzungsfunktion
   */
  t: TFunction;
  /**
   * Wird verwendet, um die Größe des Containers im Tab zu begrenzen
   */
  TabLayout: React.FC;
}
```