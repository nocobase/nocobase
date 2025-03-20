/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL } from '@nocobase/utils';
import path from 'path';
import urlJoin from 'url-join';
import { promisify } from 'util';
import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_TX_COS } from '../../constants';
import { getFileKey, getFilename } from '../utils';

export default class extends StorageType {
  static defaults() {
    return {
      title: '腾讯云对象存储',
      type: STORAGE_TYPE_TX_COS,
      name: 'tx-cos-1',
      baseUrl: process.env.TX_COS_STORAGE_BASE_URL,
      options: {
        Region: process.env.TX_COS_REGION,
        SecretId: process.env.TX_COS_SECRET_ID,
        SecretKey: process.env.TX_COS_SECRET_KEY,
        Bucket: process.env.TX_COS_BUCKET,
      },
    };
  }

  static filenameKey = 'url';

  getFileURL(file: AttachmentModel, preview?: boolean): string | Promise<string> {
    // 兼容历史数据
    if (file.url && isURL(file.url)) {
      if (preview) {
        return file.url + (this.storage.options.thumbnailRule || '');
      }
      return file.url;
    }
    const keys = [
      this.storage.baseUrl,
      file.path && encodeURI(file.path),
      file.filename,
      preview && this.storage.options.thumbnailRule,
    ].filter(Boolean);
    return urlJoin(keys);
  }

  make() {
    const createTxCosStorage = require('multer-cos');
    return new createTxCosStorage({
      cos: {
        ...this.storage.options,
        dir: (this.storage.path ?? '').replace(/\/+$/, ''),
      },
      filename: getFilename,
    });
  }
  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { cos } = this.make();
    const { Deleted } = await promisify(cos.deleteMultipleObject).call(cos, {
      Region: this.storage.options.Region,
      Bucket: this.storage.options.Bucket,
      Objects: records.map((record) => ({ Key: getFileKey(record) })),
    });
    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
