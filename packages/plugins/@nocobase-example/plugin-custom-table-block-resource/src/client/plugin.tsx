/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import models from './models';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClient extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);

    // Register todoItems to the client-side data source.
    // Note: In client-v2, you cannot call addCollection directly in load(),
    // because v2's DataSourceManager calls clearCollections during ensureLoaded(),
    // which wipes out any collection added during the load() phase.
    // In v2, use eventBus 'dataSource:loaded' event to re-register instead.
    // See src/client-v2/plugin.tsx for the v2 implementation.
    const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
    mainDS?.addCollection(todoItemsCollection);
  }
}

export default PluginCustomTableBlockResourceClient;
