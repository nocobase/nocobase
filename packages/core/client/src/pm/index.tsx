import React from 'react';
import { Plugin } from '../application/Plugin';
import { PluginManagerLink, SettingsCenterDropdown } from './PluginManagerLink';
import { PMProvider, SettingsCenter } from './PluginSetting';
import { PluginManager } from './PluginManager';

export * from './PluginManagerLink';
export * from './PluginSetting';
export * from './PluginManager';

export class PMPlugin extends Plugin {
  async load() {
    this.addComponents();
    this.addRoutes();
    this.app.use(PMProvider);
  }

  addComponents() {
    this.app.addComponents({
      PluginManagerLink,
      SettingsCenterDropdown,
    });
  }

  addRoutes() {
    this.app.router.add('admin.pm.list', {
      path: '/admin/pm/list',
      element: <PluginManager />,
    });
    this.app.router.add('admin.pm.list-tab', {
      path: '/admin/pm/list/:tabName',
      element: <PluginManager />,
    });
    this.app.router.add('admin.pm.list-tab-mdfile', {
      path: '/admin/pm/list/:tabName/:mdfile',
      element: <PluginManager />,
    });

    this.app.router.add('admin.settings.list', {
      path: '/admin/settings',
      element: <SettingsCenter />,
    });
    this.app.router.add('admin.settings.pluginName', {
      path: '/admin/settings/:pluginName',
      element: <SettingsCenter />,
    });
    this.app.router.add('admin.settings.pluginName-tabName', {
      path: '/admin/settings/:pluginName/:tabName',
      element: <SettingsCenter />,
    });
  }
}

export default PMPlugin;
