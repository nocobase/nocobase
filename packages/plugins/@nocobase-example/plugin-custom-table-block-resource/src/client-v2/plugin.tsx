/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
// TODO: client-v2 暂未提供 CollectionBlockModel，待实现后取消注释

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

export class PluginDataBlockClientV2 extends Plugin {
  async load() {
    // TODO: client-v2 暂未提供 CollectionBlockModel，待实现后取消注释
    // this.flowEngine.registerModelLoaders({
    //   TodoBlockModel: {
    //     loader: () => import('./models/TodoBlockModel'),
    //   },
    // });
    // 将 todoItems 注册到客户端数据源，让它出现在区块的数据表选择列表中
    // 通过 addReloadCallback 确保在数据源 reload 后重新注册，不被覆盖
    // const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
    // mainDS?.addCollection(todoItemsCollection);
    // mainDS?.addReloadCallback(() => {
    //   mainDS?.addCollection(todoItemsCollection);
    // });
  }
}

export default PluginDataBlockClientV2;
