/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import urlJoin from 'url-join';
import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_MINIO } from '../../constants';
import { cloudFilenameGetter, ensureUrlEncoded } from '../utils';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'MinIO 对象存储',
      name: 'minio-storage',
      type: STORAGE_TYPE_MINIO,
      baseUrl: process.env.MINIO_STORAGE_BASE_URL,
      options: {
        region: process.env.MINIO_REGION || 'us-east-1',
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
        bucket: process.env.MINIO_BUCKET,
        forcePathStyle: true, // MinIO requires path-style URLs
      },
    };
  }

  static filenameKey = 'key';

  getFileData(file, meta = {}) {
    const data = super.getFileData(file, meta);
    // 对于 MinIO，不设置 url 字段，让系统在查询时动态生成
    // 这样可以确保使用我们重写的 getFileURL 方法
    delete data.url;
    return data;
  }

  getFileURL(file: AttachmentModel, preview?: boolean): string | Promise<string> {
    console.log('MinIO getFileURL called:', {
      baseUrl: this.storage.baseUrl,
      endpoint: this.storage.options.endpoint,
      bucket: this.storage.options.bucket,
      filename: file.filename,
      path: file.path,
    });

    // 强制使用 endpoint + bucket 构建，忽略 baseUrl
    const { endpoint, bucket } = this.storage.options;
    if (endpoint && bucket) {
      // 构建 MinIO 的访问 URL: endpoint/bucket/filename
      const baseUrl = `${endpoint}/${bucket}`;
      const keys = [
        baseUrl,
        file.path && encodeURI(file.path),
        ensureUrlEncoded(file.filename),
        preview && this.storage.options.thumbnailRule,
      ].filter(Boolean);
      const result = urlJoin(keys);
      console.log('MinIO generated URL:', result);
      return result;
    }

    // 如果没有 endpoint 或 bucket，使用父类的默认实现
    console.log('MinIO fallback to parent getFileURL');
    return super.getFileURL(file, preview);
  }

  make() {
    const multerS3 = require('multer-s3');
    const {
      accessKeyId,
      secretAccessKey,
      bucket,
      endpoint,
      region,
      acl = 'public-read',
      ...options
    } = this.storage.options;

    const s3Config = {
      region: region || 'us-east-1',
      endpoint,
      forcePathStyle: true, // MinIO requires path-style URLs
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...options,
    };

    const s3 = new S3Client(s3Config);

    return multerS3({
      s3,
      bucket,
      acl,
      contentType(req, file, cb) {
        if (file.mimetype) {
          cb(null, file.mimetype);
          return;
        }

        multerS3.AUTO_CONTENT_TYPE(req, file, cb);
      },
      key: cloudFilenameGetter(this.storage),
    });
  }

  calculateContentMD5(body) {
    const hash = crypto.createHash('md5').update(body).digest('base64');
    return hash;
  }

  async deleteMinIOObjects(bucketName: string, objects: string[]) {
    const { s3 } = this.make();
    const Deleted = [];
    for (const Key of objects) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key,
      });
      await s3.send(deleteCommand);
      Deleted.push({ Key });
    }
    return {
      Deleted,
    };
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { Deleted } = await this.deleteMinIOObjects(
      this.storage.options.bucket,
      records.map((record) => this.getFileKey(record)),
    );
    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === this.getFileKey(record)))];
  }
}
