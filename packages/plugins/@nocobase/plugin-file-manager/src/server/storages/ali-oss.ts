/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_ALI_OSS } from '../../constants';
import { cloudFilenameGetter, getFileKey } from '../utils';

export default class extends StorageType {
  static defaults() {
    return {
      title: '阿里云对象存储',
      type: STORAGE_TYPE_ALI_OSS,
      name: 'ali-oss-1',
      baseUrl: process.env.ALI_OSS_STORAGE_BASE_URL || '',
      options: {
        region: process.env.ALI_OSS_REGION,
        accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
        bucket: process.env.ALI_OSS_BUCKET,
        isPrivate: false, // 新增配置项，默认非私有桶
      },
    };
  }

  make() {
    const createAliOssStorage = require('multer-aliyun-oss');
    return new createAliOssStorage({
      config: { timeout: 600_000, ...this.storage.options },
      filename: cloudFilenameGetter(this.storage),
    });
  }

  async getFileURL(file: AttachmentModel, preview?: boolean): Promise<string> {
    const { isPrivate, region, accessKeyId, accessKeySecret, bucket } = this.storage.options;
    
    // 如果配置为私有桶，则生成签名URL
    if (isPrivate && region && accessKeyId && accessKeySecret && bucket) {
      try {
        const OSS = require('ali-oss');
        const client = new OSS({
          region,
          accessKeyId,
          accessKeySecret,
          bucket,
        });
        
        const fileKey = getFileKey(file);
        // 生成1小时有效的签名URL
        const signedUrl = client.signatureUrl(fileKey, {
          expires: 3600, // 1小时
          ...(preview && this.storage.options.thumbnailRule ? { process: this.storage.options.thumbnailRule } : {}),
        });
        
        return signedUrl;
      } catch (error) {
        console.error('生成OSS签名URL失败:', error);
        // 如果生成签名URL失败，回退到默认URL
        return super.getFileURL(file, preview);
      }
    }
    
    // 非私有桶或配置不完整时，使用默认的URL生成方式
    return super.getFileURL(file, preview);
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { client } = this.make();
    const { deleted } = await client.deleteMulti(records.map(getFileKey));
    return [deleted.length, records.filter((record) => !deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
