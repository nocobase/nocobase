/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginLightComponentsServer extends Plugin {
  afterAdd() {}

  beforeLoad() {
    // Register ACL snippet for light components management
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['lightComponents:*'],
    });
  }

  async load() {
    // Define custom actions for lightComponents resource
    this.app.resourceManager.define({
      name: 'lightComponents',
      actions: {
        async duplicate(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const repository = ctx.db.getRepository('lightComponents');

          const original = await repository.findOne({
            filterByTk,
          });

          if (!original) {
            ctx.throw(404, 'Light component not found');
          }

          const duplicated = await repository.create({
            values: {
              ...original.toJSON(),
              id: undefined,
              title: `${original.title} (Copy)`,
              key: undefined, // Let it auto-generate
              createdAt: undefined,
              updatedAt: undefined,
            },
          });

          ctx.body = { data: duplicated };
          await next();
        },
      },
    });

    this.app.acl.allow('lightComponents', ['*'], 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLightComponentsServer;
