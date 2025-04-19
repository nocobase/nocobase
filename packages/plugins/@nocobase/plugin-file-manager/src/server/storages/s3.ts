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
import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_S3 } from '../../constants';
import { cloudFilenameGetter } from '../utils';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'AWS S3',
      name: 'aws-s3',
      type: STORAGE_TYPE_S3,
      baseUrl: process.env.AWS_S3_STORAGE_BASE_URL,
      options: {
        region: process.env.AWS_S3_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET,
      },
    };
  }

  static filenameKey = 'key';

  make() {
    const multerS3 = require('multer-s3');
    const { accessKeyId, secretAccessKey, bucket, acl = 'public-read', ...options } = this.storage.options;
    if (options.endpoint) {
      options.forcePathStyle = true;
    } else {
      options.endpoint = undefined;
    }
    const s3 = new S3Client({
      ...options,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

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

  async deleteS3Objects(bucketName: string, objects: string[]) {
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
    const { Deleted } = await this.deleteS3Objects(
      this.storage.options.bucket,
      records.map((record) => this.getFileKey(record)),
    );
    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === this.getFileKey(record)))];
  }
}
