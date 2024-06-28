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
    await uiSchemas.insert({
      type: 'void',
      'x-uid': 'nocobase-mobile',
      'x-component': 'Menu',
      'x-designer': 'Menu.Designer',
      'x-initializer': 'MenuItemInitializers',
      'x-component-props': {
        mode: 'mix',
        theme: 'dark',
        // defaultSelectedUid: 'u8',
        onSelect: '{{ onSelect }}',
        sideMenuRefScopeKey: 'sideMenuRef',
      },
      properties: {},
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMobileServer;
