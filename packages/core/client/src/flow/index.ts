/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, DataSourceManager, FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { Plugin } from '../application/Plugin';
import { FlowEngineRunner } from './FlowEngineRunner';
import { MockFlowModelRepository } from './FlowModelRepository';
import { FlowPage } from './FlowPage';
import * as models from './models';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.addComponents({ FlowPage });
    this.app.flowEngine.setModelRepository(new MockFlowModelRepository());
    const filteredModels = Object.fromEntries(
      Object.entries(models).filter(
        ([, ModelClass]) => typeof ModelClass === 'function' && ModelClass.prototype instanceof FlowModel,
      ),
    );
    console.log('Registering flow models:', Object.keys(filteredModels));
    this.flowEngine.registerModels(filteredModels);
    const dataSourceManager = new DataSourceManager();
    this.flowEngine.context['app'] = this.app;
    this.flowEngine.context['api'] = this.app.apiClient;
    this.flowEngine.context['dataSourceManager'] = dataSourceManager;
    try {
      const response = await this.app.apiClient.request<any>({
        url: '/collections:listMeta',
      });
      const mainDataSource = new DataSource({
        name: 'main',
        displayName: 'Main',
      });
      dataSourceManager.addDataSource(mainDataSource);
      const collections = response.data?.data || [];
      collections.forEach((collection) => {
        mainDataSource.addCollection(collection);
      });
    } catch (error) {
      console.error('Failed to load collections:', error);
      // Optionally, you can throw an error or handle it as needed
    }
    this.app.addProvider(FlowEngineRunner, {});
  }
}

// Export all models for external use
export * from './models';
