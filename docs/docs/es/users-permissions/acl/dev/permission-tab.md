:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extensión de las pestañas de configuración de permisos

A continuación, le mostraremos un ejemplo con la opción de configuración "Menú Móvil" para demostrar cómo extender una nueva pestaña de configuración de permisos. El resultado se muestra en la siguiente imagen:

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

El código es el siguiente:

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

Primero, necesitamos obtener una instancia del `plugin` `PluginACLClient` ([otros métodos para obtener instancias de plugins](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)) y añadir una nueva pestaña de configuración de permisos utilizando el método `settingsUI.addPermissionsTab`. En este ejemplo, hemos añadido una pestaña de configuración de permisos llamada "Menú Móvil".

El valor de la propiedad `settingsUI` es una instancia de una clase llamada `ACLSettingsUI`, y su información de tipo es la siguiente:

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
   * la clave del panel de pestañas actualmente activo
   */
  activeKey: string;
  /**
   * el rol actualmente seleccionado
   */
  role: Role;
  /**
   * función de traducción
   */
  t: TFunction;
  /**
   * se utiliza para limitar el tamaño del contenedor en la Pestaña
   */
  TabLayout: React.FC;
}
```