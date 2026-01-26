:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Tab Konfigurasi Izin

Berikut adalah contoh item konfigurasi "Menu Seluler", yang menunjukkan cara memperluas tab konfigurasi izin baru. Hasilnya dapat dilihat pada gambar di bawah ini:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Berikut adalah kodenya:

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

Pertama, kita perlu mendapatkan instance dari **plugin** `PluginACLClient` ([metode lain untuk mendapatkan instance plugin](/plugin-development/client/plugin#get-plugin-instance)), dan menambahkan tab konfigurasi izin baru menggunakan metode `settingsUI.addPermissionsTab`. Dalam contoh ini, kita menambahkan tab konfigurasi izin yang bernama "Menu Seluler".

Nilai properti `settingsUI` adalah instance dari kelas bernama `ACLSettingsUI`, dan informasi tipenya adalah sebagai berikut:

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