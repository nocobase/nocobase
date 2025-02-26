/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';

const currentStorage = [STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS];

export class FileModel extends Model {
  public toJSON() {
    const json = super.toJSON();
    const fileStorages = this.constructor['database']?.['_fileStorages'];
    if (json.storageId && fileStorages && fileStorages.has(json.storageId)) {
      const storage = fileStorages.get(json.storageId);
      // 当前文件管理器内的存储类型拼接生成预览链接，其他文件存储自行处理
      if (currentStorage.includes(storage?.type) && storage?.options?.thumbnailRule) {
        json['preview'] = `${json['url']}${storage?.options?.thumbnailRule || ''}`;
      }
      if (storage?.options?.thumbnailRule) {
        json['thumbnailRule'] = storage?.options?.thumbnailRule;
      }
      if (storage?.type === 'local' && process.env.APP_PUBLIC_PATH) {
        json['url'] = process.env.APP_PUBLIC_PATH.replace(/\/$/g, '') + json.url;
      }
    }
    return json;
  }
}
