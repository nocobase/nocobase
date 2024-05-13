/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class PluginMobileServer extends Plugin {
  afterAdd() {}

  async load() {
    this.db.addMigrations({
      namespace: 'client',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  async install() {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    await uiSchemas.insert({
      type: 'void',
      'x-uid': 'nocobase-mobile-container',
      'x-component': 'MContainer',
      'x-designer': 'MContainer.Designer',
      'x-component-props': {},
      properties: {
        page: {
          type: 'void',
          'x-component': 'MPage',
          'x-designer': 'MPage.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'mobilePage:addBlock',
              'x-component-props': {
                showDivider: false,
              },
            },
          },
        },
      },
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMobileServer;
