/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';

export class FileModel extends Model {
  public toJSON() {
    const json = super.toJSON();
    const fileStorages = this.constructor['database']?.['_fileStorages'];
    if (json.storageId && fileStorages && fileStorages.has(json.storageId)) {
      const storage = fileStorages.get(json.storageId);
      json['thumbnailRule'] = storage?.options?.thumbnailRule;
      if (!json['thumbnailRule'] && storage?.type === 'ali-oss') {
        json['thumbnailRule'] = '?x-oss-process=image/auto-orient,1/resize,m_fill,w_94,h_94/quality,q_90';
      }
      if (storage?.type === 'local' && process.env.APP_PUBLIC_PATH) {
        json['url'] = process.env.APP_PUBLIC_PATH.replace(/\/$/g, '') + json.url;
      }
    }
    return json;
  }
}
