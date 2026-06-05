:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Estendendo as abas de configuração de permissões

Abaixo, vamos usar o item de configuração "Menu Mobile" como exemplo para demonstrar como estender uma nova aba de configuração de permissões. O resultado é mostrado na imagem a seguir:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

O código é o seguinte:

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

Primeiro, precisamos obter uma instância do `plugin` `PluginACLClient` ([outros métodos para obter instâncias de plugins](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)). Em seguida, adicionamos uma nova aba de configuração de permissões usando o método `settingsUI.addPermissionsTab`. Neste exemplo, adicionamos uma aba de configuração de permissões chamada "Menu Mobile".

O valor da propriedade `settingsUI` é uma instância de uma classe chamada `ACLSettingsUI`, e suas informações de tipo são as seguintes:

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
   * A chave do painel de aba atualmente ativo
   */
  activeKey: string;
  /**
   * O papel (role) atualmente selecionado
   */
  role: Role;
  /**
   * Função de tradução
   */
  t: TFunction;
  /**
   * Usado para restringir o tamanho do contêiner na Aba
   */
  TabLayout: React.FC;
}
```