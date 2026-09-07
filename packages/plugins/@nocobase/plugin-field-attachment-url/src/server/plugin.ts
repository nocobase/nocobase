/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginFieldAttachmentUrlServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.resourceManager.registerActionHandlers({
      'collections:listFileCollectionsWithPublicStorage': async (ctx, next) => {
        const fileCollections = await this.db.getRepository('collections').find({
          filter: {
            'options.template': 'file',
          },
        });

        const options = [];

        for (const fileCollection of fileCollections) {
          if (fileCollection.name === 'attachments') {
            continue;
          }
          options.push({
            name: fileCollection.name,
            title: fileCollection.title,
          });
        }

        ctx.body = options;

        await next();
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldAttachmentUrlServer;
