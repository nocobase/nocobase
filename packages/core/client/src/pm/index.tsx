import React from 'react';
import { Plugin } from '../application/Plugin';
import { PluginManagerLink, SettingsCenterDropdown } from './PluginManagerLink';
import { ADMIN_SETTINGS_PATH, SettingsCenterComponent } from './PluginSetting';
import { PluginManager } from './PluginManager';
import { ACLPane } from '../acl/ACLShortcut';
import { CollectionManagerPane } from '../collection-manager';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';

export * from './PluginManagerLink';
export * from './PluginSetting';
export * from './PluginManager';

export class PMPlugin extends Plugin {
  async load() {
    this.addComponents();
    this.addRoutes();
    this.addSettings();
  }

  addSettings() {
    this.app.settingsCenter.add('acl', {
      title: '{{t("ACL")}}',
      icon: 'LockOutlined',
      Component: ACLPane,
      isBookmark: true,
    });
    this.app.settingsCenter.add('ui-schema-storage', {
      title: '{{t("Block templates")}}',
      icon: 'LayoutOutlined',
      Component: BlockTemplatesPane,
      isBookmark: true,
    });
    this.app.settingsCenter.add('collection-manager', {
      icon: 'DatabaseOutlined',
      title: '{{t("Collection manager")}}',
      Component: CollectionManagerPane,
      isBookmark: true,
    });
    this.app.settingsCenter.add('system-settings', {
      icon: 'SettingOutlined',
      title: '{{t("System settings")}}',
      Component: SystemSettingsPane,
      isBookmark: true,
    });
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

    this.app.router.add('admin.settings', {
      path: ADMIN_SETTINGS_PATH,
      element: <SettingsCenterComponent />,
    });
  }
}

export default PMPlugin;
