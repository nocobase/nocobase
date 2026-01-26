:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 権限設定タブの拡張

「モバイルメニュー」設定項目を例に、新しい権限設定タブを拡張する方法を説明します。結果は以下の図のようになります。

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

コードは以下の通りです。

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

まず、`PluginACLClient` プラグインのインスタンスを取得する必要があります（[プラグインインスタンスを取得するその他の方法](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)）。そして、`settingsUI.addPermissionsTab` メソッドを使って、新しい権限設定タブを追加します。この例では、「モバイルメニュー」という名前の権限設定タブを追加しました。

`settingsUI` プロパティの値は、`ACLSettingsUI` という名前のクラスのインスタンスです。その型情報は以下の通りです。

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
   * 現在アクティブなタブパネルのキー
   */
  activeKey: string;
  /**
   * 現在選択されているロール
   */
  role: Role;
  /**
   * 翻訳関数
   */
  t: TFunction;
  /**
   * タブ内のコンテナのサイズを制約するために使用されます
   */
  TabLayout: React.FC;
}
```