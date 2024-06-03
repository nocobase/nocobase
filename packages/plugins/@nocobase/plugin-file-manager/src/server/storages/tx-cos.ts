/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promisify } from 'util';

import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_TX_COS } from '../../constants';
import { getFilename, getFileKey } from '../utils';

export default class extends StorageType {
  filenameKey = 'url';
  make(storage) {
    const createTxCosStorage = require('multer-cos');
    return new createTxCosStorage({
      cos: {
        ...storage.options,
        dir: (storage.path ?? '').replace(/\/+$/, ''),
      },
      filename: getFilename,
    });
  }
  defaults() {
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
  async delete(storage, records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { cos } = this.make(storage);
    const { Deleted } = await promisify(cos.deleteMultipleObject).call(cos, {
      Region: storage.options.Region,
      Bucket: storage.options.Bucket,
      Objects: records.map((record) => ({ Key: getFileKey(record) })),
    });
    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
