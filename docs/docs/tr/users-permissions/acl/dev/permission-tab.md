:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İzin Yapılandırma Sekmelerini Genişletme

Aşağıda, "Mobil Menü" yapılandırma öğesini örnek alarak yeni bir izin yapılandırma sekmesini nasıl genişletebileceğinizi göstereceğiz. Sonuç aşağıdaki görselde gösterilmiştir:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

Kod aşağıdaki gibidir:

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

İlk olarak, `PluginACLClient` eklentisinin bir örneğini edinmemiz gerekiyor ([eklenti örneklerini edinmenin diğer yöntemleri](/plugin-development/client/plugin#get-plugin-instance)). Ardından, `settingsUI.addPermissionsTab` yöntemini kullanarak yeni bir izin yapılandırma sekmesi ekliyoruz. Bu örnekte, "Mobil Menü" adında bir izin yapılandırma sekmesi ekledik.

`settingsUI` özelliğinin değeri, `ACLSettingsUI` adında bir sınıfın örneğidir ve tip bilgileri aşağıdaki gibidir:

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
   * Şu anda etkin olan sekme panelinin anahtarı
   */
  activeKey: string;
  /**
   * Şu anda seçili olan rol
   */
  role: Role;
  /**
   * Çeviri fonksiyonu
   */
  t: TFunction;
  /**
   * Sekmedeki kapsayıcının boyutunu sınırlamak için kullanılır
   */
  TabLayout: React.FC;
}
```