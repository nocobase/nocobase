---
pkg: '@nocobase/plugin-acl'
title: "Memperluas Tab Konfigurasi Izin"
description: "Memperluas tab konfigurasi izin plugin ACL NocoBase: addPermissionsTab, TabLayout, tab izin kustom, dengan contoh menu mobile."
keywords: "memperluas konfigurasi izin,addPermissionsTab,tab izin,pengembangan ACL,manajemen izin,NocoBase"
---

# Memperluas Tab Konfigurasi Izin

Berikut adalah contoh dengan item konfigurasi "menu mobile", yang menunjukkan cara memperluas tab konfigurasi izin baru. Hasilnya seperti gambar di bawah ini:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Kode-nya sebagai berikut:

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

Pertama, kita perlu mendapatkan instance dari plugin `PluginACLClient` ([cara lain untuk mendapatkan instance plugin](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)), dan menambahkan tab konfigurasi izin baru melalui metode `settingsUI.addPermissionsTab`. Pada contoh ini, kita menambahkan tab konfigurasi izin bernama "Menu Mobile".

Nilai dari properti `settingsUI` adalah instance dari class bernama `ACLSettingsUI`, dengan informasi tipe sebagai berikut:

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
