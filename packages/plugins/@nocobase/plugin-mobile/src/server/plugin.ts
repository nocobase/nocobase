/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginMobileServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {
    const uiSchemas = this.db.getRepository<any>('uiSchemas');
    await uiSchemas.remove('nocobase-mobile');
    await uiSchemas.insert({
      name: 'nocobase-mobile',
      'x-uid': 'nocobase-mobile',
      type: 'void',
      properties: {
        pageOutlet: {
          type: 'void',
          'x-component': 'MobilePageOutlet',
        },
        tabBar: {
          type: 'void',
          'x-component': 'MobileTabBar',
          'x-decorator': 'BlockItem',
          'x-decorator-props': {
            style: {
              position: 'sticky',
              bottom: 0,
              zIndex: 1000,
            },
          },
          'x-settings': 'mobile:tab-bar',
          'x-toolbar-props': {
            draggable: false,
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
