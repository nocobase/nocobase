/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import PluginACLClient from '@nocobase/plugin-acl/client';
import { uid } from '@nocobase/utils/client';
import React from 'react';
import { DatabaseConnectionProvider } from './DatabaseConnectionProvider';
import { ThirdDataSource } from './ThridDataSource';
import { BreadcumbTitle } from './component/BreadcumbTitle';
import { CollectionManagerPage } from './component/CollectionsManager';
import { DatabaseConnectionManagerPane } from './component/DatabaseConnectionManager';
import { MainDataSourceManager } from './component/MainDataSourceManager';
import { DataSourcePermissionManager } from './component/PermissionManager';
import { NAMESPACE } from './locale';
import { CollectionMainProvider } from './component/MainDataSourceManager/CollectionMainProvider';

export class PluginDataSourceManagerClient extends Plugin {
  types = new Map();

  extendedTabs = {};

  getExtendedTabs() {
    return this.extendedTabs;
  }

  registerPermissionTab(schema) {
    this.extendedTabs[uid()] = schema;
  }

  async load() {
    // register a configuration item in the Users & Permissions management page
    this.app.pm.get(PluginACLClient).settingsUI.addPermissionsTab(({ t, TabLayout, activeRole }) => ({
      key: 'dataSource',
      label: t('Data sources'),
      children: (
        <TabLayout>
          <DataSourcePermissionManager role={activeRole} />
        </TabLayout>
      ),
    }));

    this.app.use(DatabaseConnectionProvider);

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Data sources", { ns: "${NAMESPACE}" })}}`,
      icon: 'ClusterOutlined',
      showTabs: false,
      aclSnippet: 'pm.data-source-manager*',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.list`, {
      title: `{{t("Data sources", { ns: "${NAMESPACE}" })}}`,
      Component: DatabaseConnectionManagerPane,
      sort: 1,
      skipAclConfigure: true,
      aclSnippet: 'pm.data-source-manager',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/:name`, {
      title: <BreadcumbTitle />,
      icon: 'ClusterOutlined',
      isTopLevel: false,
      sort: 100,
      skipAclConfigure: true,
      aclSnippet: 'pm.data-source-manager',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/main`, {
      title: <BreadcumbTitle />,
      icon: 'ClusterOutlined',
      isTopLevel: false,
      sort: 100,
      skipAclConfigure: true,
      aclSnippet: 'pm.data-source-manager.data-source-main',
      Component: CollectionMainProvider,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/main.collections`, {
      title: `{{t("Collections", { ns: "${NAMESPACE}" })}}`,
      Component: MainDataSourceManager,
      topLevelName: `${NAMESPACE}/main`,
      pluginKey: NAMESPACE,
      skipAclConfigure: true,
      aclSnippet: 'pm.data-source-manager.data-source-main',
    });
    // this.app.pluginSettingsManager.add(`${NAMESPACE}/main.permissions`, {
    //   title: `{{t("Permissions", { ns: "${NAMESPACE}" })}}`,
    //   Component: PermissionManager,
    //   topLevelName: `${NAMESPACE}/main`,
    //   pluginKey: NAMESPACE,
    // });
    this.app.pluginSettingsManager.add(`${NAMESPACE}/:name.collections`, {
      title: `{{t("Collections", { ns: "${NAMESPACE}" })}}`,
      Component: CollectionManagerPage,
      topLevelName: `${NAMESPACE}/:name`,
      pluginKey: NAMESPACE,
      skipAclConfigure: true,
      aclSnippet: 'pm.data-source-manager.data-source-main',
    });
    // this.app.pluginSettingsManager.add(`${NAMESPACE}/:name.permissions`, {
    //   title: `{{t("Permissions", { ns: "${NAMESPACE}" })}}`,
    //   Component: PermissionManager,
    //   topLevelName: `${NAMESPACE}/:name`,
    //   pluginKey: NAMESPACE,
    // });

    this.app.dataSourceManager.addDataSources(this.getThirdDataSource.bind(this), ThirdDataSource);
    // this.setDataSources();
  }

  async setDataSources() {
    const allDataSources = await this.app.apiClient.request<{
      data: any;
    }>({
      resource: 'dataSources',
      action: 'listEnabled',
      params: {
        paginate: false,
        // appends: ['collections'],
      },
    });

    return allDataSources?.data?.data;
  }

  async getThirdDataSource() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      resource: 'dataSources',
      action: 'listEnabled',
      params: {
        paginate: false,
        appends: ['collections'],
      },
    });

    return service?.data?.data;
  }

  registerType(name: string, options) {
    this.types.set(name, options);
  }
}

export default PluginDataSourceManagerClient;
