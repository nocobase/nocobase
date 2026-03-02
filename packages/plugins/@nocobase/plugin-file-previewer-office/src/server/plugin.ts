/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import * as collections from './collections';

export class PluginFilePreviewerOfficeServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // 注册 collections
    Object.values(collections).forEach((collection: any) => {
      this.db.collection(collection);
    });
  }

  async install() {
    // 创建默认配置
    const repository = this.db.getRepository('filePreviewer');
    const exists = await repository.findOne();
    if (!exists) {
      await repository.create({
        values: {
          previewType: 'microsoft',
          kkFileViewUrl: 'http://localhost:8012',
        },
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFilePreviewerOfficeServer;
