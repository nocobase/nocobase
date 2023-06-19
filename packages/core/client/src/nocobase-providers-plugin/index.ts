import { Link, NavLink } from 'react-router-dom';
import { ACLProvider } from '../acl';
import { AntdConfigProvider } from '../antd-config-provider';
import { Plugin } from '../application-v2';
import { SigninPage, SigninPageExtensionProvider, SignupPage } from '../auth';
import { BlockSchemaComponentProvider } from '../block-provider';
import { RemoteDocumentTitleProvider } from '../document-title';
import { PinnedPluginListProvider } from '../plugin-manager';
import PMProvider, { PluginManagerLink, SettingsCenterDropdown } from '../pm';
import { AdminLayout, AuthLayout, RemoteRouteSwitchProvider, RouteSchemaComponent } from '../route-switch';
import {
  AntdSchemaComponentProvider,
  DesignableSwitch,
  MenuItemInitializers,
  SchemaComponentProvider,
} from '../schema-component';
import { SchemaInitializerProvider } from '../schema-initializer';
import { BlockTemplateDetails, BlockTemplatePage } from '../schema-templates';
import { SystemSettingsProvider } from '../system-settings';

export class NoCoBaseProvidersPlugin extends Plugin {
  async load() {
    this.app.use(AntdConfigProvider, { remoteLocale: true });
    this.app.use(RemoteRouteSwitchProvider, {
      components: {
        AuthLayout,
        AdminLayout,
        RouteSchemaComponent,
        SigninPage,
        SignupPage,
        BlockTemplatePage,
        BlockTemplateDetails,
      },
    });
    this.app.use(SystemSettingsProvider);
    this.app.use(PinnedPluginListProvider, {
      items: {
        ui: { order: 100, component: 'DesignableSwitch', pin: true, snippet: 'ui.*' },
        pm: { order: 200, component: 'PluginManagerLink', pin: true, snippet: 'pm' },
        sc: { order: 300, component: 'SettingsCenterDropdown', pin: true, snippet: 'pm.*' },
      },
    });
    this.app.use(SchemaComponentProvider, {
      components: { Link, NavLink, DesignableSwitch, PluginManagerLink, SettingsCenterDropdown },
    });
    this.app.use(SchemaInitializerProvider, {
      initializers: {
        MenuItemInitializers,
      },
    });
    this.app.use(BlockSchemaComponentProvider);
    this.app.use(AntdSchemaComponentProvider);
    this.app.use(SigninPageExtensionProvider);
    this.app.use(ACLProvider);
    this.app.use(RemoteDocumentTitleProvider);
    this.app.use(PMProvider);
  }
}
