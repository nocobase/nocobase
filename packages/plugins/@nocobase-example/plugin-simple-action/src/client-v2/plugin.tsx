/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
// TODO: client-v2 暂未提供 ActionModel，待实现后取消注释

export class PluginSimpleActionClientV2 extends Plugin {
  async load() {
    // TODO: client-v2 暂未提供 ActionModel，待实现后取消注释
    // this.flowEngine.registerModelLoaders({
    //   SimpleCollectionActionModel: {
    //     loader: () => import('./models/SimpleCollectionActionModel'),
    //   },
    //   SimpleRecordActionModel: {
    //     loader: () => import('./models/SimpleRecordActionModel'),
    //   },
    //   SimpleBothActionModel: {
    //     loader: () => import('./models/SimpleBothActionModel'),
    //   },
    // });
  }
}

export default PluginSimpleActionClientV2;
