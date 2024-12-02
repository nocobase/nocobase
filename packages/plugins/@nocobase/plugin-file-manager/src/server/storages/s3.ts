/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_S3 } from '../../constants';
import { cloudFilenameGetter, getFileKey } from '../utils';

export default class extends StorageType {
  filenameKey = 'key';
  make(storage) {
    const { S3Client } = require('@aws-sdk/client-s3');
    const multerS3 = require('multer-s3');
    const { accessKeyId, secretAccessKey, bucket, acl = 'public-read', ...options } = storage.options;
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
      key: cloudFilenameGetter(storage),
    });
  }
  defaults() {
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
  async delete(storage, records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
    const { s3 } = this.make(storage);
    const { Deleted } = await s3.send(
      new DeleteObjectsCommand({
        Bucket: storage.options.bucket,
        Delete: {
          Objects: records.map((record) => ({ Key: getFileKey(record) })),
        },
      }),
    );

    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
