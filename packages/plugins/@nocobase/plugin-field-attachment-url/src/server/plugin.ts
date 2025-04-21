/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';

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

        const filePlugin = this.pm.get('file-manager') as PluginFileManagerServer | any;

        const options = [];

        const fileCollection = this.db.getCollection('attachments');

        if (await filePlugin.isPublicAccessStorage(fileCollection?.options?.storage)) {
          options.push({
            title: '{{t("Attachments")}}',
            name: 'attachments',
          });
        }

        for (const fileCollection of fileCollections) {
          if (await filePlugin.isPublicAccessStorage(fileCollection?.options?.storage)) {
            options.push({
              name: fileCollection.name,
              title: fileCollection.title,
            });
          }
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
