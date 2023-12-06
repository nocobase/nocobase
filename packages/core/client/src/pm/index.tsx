import React from 'react';
import { Plugin } from '../application/Plugin';
import { PluginManagerLink, SettingsCenterDropdown } from './PluginManagerLink';
import { AdminSettingsLayout } from './PluginSetting';
import { PluginManager } from './PluginManager';
import { ACLPane } from '../acl/ACLShortcut';
import { CollectionManagerPane } from '../collection-manager';
import { BlockTemplatesPane } from '../schema-templates';
import { SystemSettingsPane } from '../system-settings';
import { ADMIN_SETTINGS_PATH } from '../application';
import { Outlet } from 'react-router-dom';

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
    this.app.pluginSettingsManager.add('acl', {
      title: '{{t("ACL")}}',
      icon: 'LockOutlined',
      Component: ACLPane,
      aclSnippet: 'pm.acl.roles',
    });
    this.app.pluginSettingsManager.add('ui-schema-storage', {
      title: '{{t("Block templates")}}',
      icon: 'LayoutOutlined',
      Component: BlockTemplatesPane,
      aclSnippet: 'pm.ui-schema-storage.block-templates',
    });
    this.app.pluginSettingsManager.add('system-settings', {
      icon: 'SettingOutlined',
      title: '{{t("System settings")}}',
      Component: SystemSettingsPane,
      aclSnippet: 'pm.system-settings.system-settings',
    });

    this.app.pluginSettingsManager.add('collection-manager', {
      icon: 'DatabaseOutlined',
      title: '{{t("Collection manager")}}',
    });

    this.app.pluginSettingsManager.add('collection-manager.collections', {
      title: '{{t("Collections & Fields")}}',
      Component: CollectionManagerPane,
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
      element: <AdminSettingsLayout />,
    });
  }
}

export default PMPlugin;
