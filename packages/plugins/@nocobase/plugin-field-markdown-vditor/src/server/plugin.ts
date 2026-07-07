/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import fs from 'fs-extra';
import path from 'path';

// @ts-ignore
import pkg from '../../package.json';

const namespace = pkg.name;

export class PluginFieldMarkdownVditorServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.copyVditorDist();
    this.setResource();
    this.app.acl.allow('vditor', 'check', 'loggedIn');
  }

  setResource() {
    this.app.resourceManager.define({
      name: 'vditor',
      actions: {
        check: async (context, next) => {
          const { fileCollectionName } = context.action.params;
          let storage;

          const fileCollection = this.db.getCollection(fileCollectionName || 'attachments');
          const storageName = fileCollection?.options?.storage;
          if (storageName) {
            storage = await this.db.getRepository('storages').findOne({
              where: {
                name: storageName,
              },
            });
          } else {
            storage = await this.db.getRepository('storages').findOne({
              where: {
                default: true,
              },
            });
          }

          if (!storage) {
            context.throw(
              400,
              context.t('Storage configuration not found. Please configure a storage provider first.', {
                ns: namespace,
              }),
            );
          }

          const isSupportToUploadFiles =
            storage.type !== 's3-compatible' || (storage.options?.baseUrl && storage.options?.public);

          const storageInfo = {
            id: storage.id,
            title: storage.title,
            name: storage.name,
            type: storage.type,
            rules: storage.rules,
          };

          context.body = {
            isSupportToUploadFiles: !!isSupportToUploadFiles,
            storage: storageInfo,
          };

          await next();
        },
      },
    });
  }

  async copyVditorDist() {
    const dist = path.resolve(__dirname, '../../dist/client/vditor/dist');
    if (await fs.exists(dist)) {
      return;
    }
    const vditor = path.dirname(require.resolve('vditor'));
    await fs.copy(vditor, dist);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldMarkdownVditorServer;
