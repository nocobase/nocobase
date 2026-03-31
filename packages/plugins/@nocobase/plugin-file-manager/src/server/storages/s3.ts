/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import urlJoin from 'url-join';
import { isURL } from '@nocobase/utils';
import crypto from 'crypto';
import { Transform, TransformCallback } from 'stream';
import { AttachmentModel, StorageModel, StorageType } from '.';
import { STORAGE_TYPE_S3 } from '../../constants';
import { cloudFilenameGetter, ensureUrlEncoded } from '../utils';

class CountingStream extends Transform {
  size = 0;

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    this.size += chunk.length;
    callback(null, chunk);
  }
}

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

  client: S3Client;

  constructor(storage: StorageModel) {
    super(storage);
    const { accessKeyId, secretAccessKey, ...options } = this.storage.options;
    const params: any = {
      ...options,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    };
    if (accessKeyId && secretAccessKey) {
      params.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }
    if (options.endpoint) {
      params.forcePathStyle = true;
    } else {
      params.endpoint = undefined;
    }
    this.client = new S3Client(params);
    this.client.middlewareStack.remove('flexibleChecksumsMiddleware');
    this.client.middlewareStack.remove('flexibleChecksumsInputMiddleware');
  }

  make() {
    const { bucket, acl = 'public-read' } = this.storage.options;
    const keyGetter = cloudFilenameGetter(this.storage);
    const client = this.client;

    const once = (fn) => {
      let called = false;
      return (...args) => {
        if (called) return;
        called = true;
        fn(...args);
      };
    };

    return {
      s3: client,
      async _handleFile(req, file, cb) {
        const done = once(cb);
        let key: string;
        try {
          key = await new Promise<string>((resolve, reject) => {
            keyGetter(req, file, (err, value) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(value);
            });
          });
        } catch (error) {
          done(error);
          return;
        }
        try {
          const contentType = file.mimetype || 'application/octet-stream';
          const counter = new CountingStream();
          const uploadStream = file.stream.pipe(counter);
          const upload = new Upload({
            client,
            params: {
              Bucket: bucket,
              Key: key,
              ACL: acl,
              Body: uploadStream,
              ContentType: contentType,
            },
            queueSize: 1,
            leavePartsOnError: false,
          });

          const result = await upload.done();
          done(null, {
            size: counter.size,
            bucket,
            key,
            acl,
            contentType,
            etag: result.ETag,
            versionId: result.VersionId,
          });
        } catch (error) {
          done(error);
        }
      },
      _removeFile(req, file, cb) {
        (async () => {
          try {
            await client.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: file.key,
              }),
            );
            cb(null);
          } catch (err) {
            cb(err);
          }
        })();
      },
    };
  }

  async deleteS3Objects(bucketName: string, objects: string[]) {
    const Deleted = [];
    for (const Key of objects) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key,
      });
      await this.client.send(deleteCommand);
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
