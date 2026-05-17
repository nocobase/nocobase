/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promisify } from 'util';
import { Transform, TransformCallback } from 'stream';
import urlJoin from 'url-join';
import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_TX_COS } from '../../constants';
import { cloudFilenameGetter, getFileKey } from '../utils';

const ERROR_NO_CLIENT = new Error('cos client undefined');

class CountingStream extends Transform {
  size = 0;

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
    this.size += chunk.length;
    callback(null, chunk);
  }
}

class TxCosStorage {
  cos;
  getFilename: Function;
  baseUrl: string;
  options: Record<string, any>;

  constructor({ config, baseUrl, filename }) {
    const COS = require('cos-nodejs-sdk-v5');
    this.cos = new COS({
      SecretId: config.SecretId,
      SecretKey: config.SecretKey,
      SecurityToken: config.SecurityToken,
      XCosSecurityToken: config.XCosSecurityToken,
      FileParallelLimit: config.FileParallelLimit,
      ChunkParallelLimit: config.ChunkParallelLimit,
      ChunkSize: config.ChunkSize,
      Domain: config.Domain,
      Protocol: config.Protocol,
      Timeout: config.Timeout,
      KeepAlive: config.KeepAlive,
      ForcePathStyle: config.ForcePathStyle,
      CompatibilityMode: config.CompatibilityMode,
      UseAccelerate: config.UseAccelerate,
    });
    this.getFilename = filename;
    this.baseUrl = baseUrl;
    this.options = config;
  }

  getUploadedFileURL(key: string, location?: string) {
    if (this.baseUrl) {
      return urlJoin(this.baseUrl, key);
    }
    if (!location) {
      return key;
    }
    if (/^https?:\/\//.test(location)) {
      return location;
    }
    return `https://${location}`;
  }

  _handleFile(req, file, cb) {
    if (!this.cos) {
      return cb(ERROR_NO_CLIENT);
    }

    const getFilename = promisify(this.getFilename);

    Promise.resolve()
      .then(async () => {
        const key = await getFilename(req, file);
        const counter = new CountingStream();
        const body = file.stream.pipe(counter);
        const params: Record<string, any> = {
          Bucket: this.options.Bucket,
          Region: this.options.Region,
          Key: key,
          Body: body,
        };

        if (file.mimetype === 'text/plain') {
          params.ContentType = 'text/plain; charset=utf-8';
        } else if (file.mimetype) {
          params.ContentType = file.mimetype;
        }

        const result = await promisify(this.cos.putObject).call(this.cos, params);

        // eslint-disable-next-line promise/no-callback-in-promise
        cb(null, {
          key,
          size: counter.size,
          url: this.getUploadedFileURL(key, result?.Location),
        });
      })
      // eslint-disable-next-line promise/no-callback-in-promise
      .catch(cb);
  }

  _removeFile(req, file, cb) {
    if (!this.cos) {
      return cb(ERROR_NO_CLIENT);
    }
    if (!file.key) {
      return cb(null);
    }

    this.cos.deleteObject(
      {
        Bucket: this.options.Bucket,
        Region: this.options.Region,
        Key: file.key,
      },
      cb,
    );
  }
}

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

  make() {
    return new TxCosStorage({
      config: this.storage.options,
      baseUrl: this.storage.baseUrl,
      filename: cloudFilenameGetter(this.storage),
    });
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { cos } = this.make() as any;
    const { Deleted } = await promisify(cos.deleteMultipleObject).call(cos, {
      Region: this.storage.options.Region,
      Bucket: this.storage.options.Bucket,
      Objects: records.map((record) => ({ Key: getFileKey(record) })),
    });
    return [Deleted.length, records.filter((record) => !Deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
