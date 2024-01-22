import { Plugin } from '@nocobase/client';
import { DatabaseConnectionProvider } from './DatabaseConnectionProvider';
import { NAMESPACE } from './locale';
import { DatabaseConnectionManagerPane } from './component/DatabaseConnectionManager';
import { CollectionManager } from './component/CollectionsManager';
import { PermissionManager } from './component/PermissionManager';
import { BreadcumbTitle } from './component/BreadcumbTitle';
import React from 'react';

export class PluginDataSourceManagerClient extends Plugin {
  databaseTypes = new Map();
  async load() {
    this.app.use(DatabaseConnectionProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Data soure manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'ClusterOutlined',
      showTabs: false,
      aclSnippet: 'pm.database-connections.manager',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.list`, {
      title: `{{t("Data soure manager", { ns: "${NAMESPACE}" })}}`,
      Component: DatabaseConnectionManagerPane,
      sort: 1,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/:name`, {
      title: <BreadcumbTitle />,
      icon: 'ClusterOutlined',
      isTopLevel: false,
      sort: 100,
    });

    this.app.pluginSettingsManager.add(`${NAMESPACE}/:name.collections`, {
      title: `{{t("Collections", { ns: "${NAMESPACE}" })}}`,
      Component: CollectionManager,
      topLevelName: `${NAMESPACE}/:name`,
      pluginKey: NAMESPACE,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/:name.permissions`, {
      title: `{{t("Permissions", { ns: "${NAMESPACE}" })}}`,
      Component: PermissionManager,
      topLevelName: `${NAMESPACE}/:name`,
      pluginKey: NAMESPACE,
    });

    this.collectionManager.setThirdDataSource(this.getThirdDataSource.bind(this));
  }

  async getThirdDataSource() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      resource: 'databaseConnections',
      action: 'list',
      params: {
        paginate: false,
        appends: ['collections'],
      },
    });

    return service?.data?.data;
  }

  registerDatabaseType(name: string, options) {
    this.databaseTypes.set(name, options);
  }
}

export default PluginDataSourceManagerClient;
