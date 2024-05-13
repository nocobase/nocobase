/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginGraphCollectionManagerServer extends Plugin {
  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.data-source-manager.graph-collection-manager',
      actions: ['graphPositions:*'],
    });
  }
}

export default PluginGraphCollectionManagerServer;
