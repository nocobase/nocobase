/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promisify } from 'util';
import Path from 'path';
import crypto from 'crypto';

import { AttachmentModel, StorageType } from '.';
import { STORAGE_TYPE_ALI_OSS } from '../../constants';
import { cloudFilenameGetter, getFileKey } from '../utils';

const ERROR_NO_CLIENT = new Error('oss client undefined');

// keep same signature as multer native
function getRandomFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : `${raw.toString('hex')}${Path.extname(file.originalname)}`);
  });
}

class AliYunOssStorage {
  client;
  getDestination: Function;
  getFilename: Function;
  constructor({ config, destination = '', filename = getRandomFilename }) {
    const OSS = require('ali-oss');
    this.client = new OSS(config);
    this.getDestination = typeof destination === 'string' ? (req, file, cb) => cb(null, destination) : destination;
    this.getFilename = filename;
  }

  _handleFile(req, file, cb) {
    if (!this.client) {
      return cb(ERROR_NO_CLIENT);
    }

    const getDestination = promisify(this.getDestination);
    const getFilename = promisify(this.getFilename);

    let size = 0;

    Promise.all([getDestination(req, file), getFilename(req, file)])
      .then(([destination, filename]) => {
        // add listener here because if put in upper scope,
        // the uploaded file will be 0 byte (very weird!).
        file.stream.on('data', (chunk) => {
          size += Buffer.byteLength(chunk);
        });

        const options: Record<string, any> = {};
        if (file.mimetype === 'text/plain') {
          options.mime = 'text/plain; charset=utf-8'; // force text/plain to have utf-8 charset
        }
        return this.client.putStream(`${destination}/${filename}`, file.stream, options);
      })
      .then((result) => {
        const { url, name } = result;
        const lastSlashIndex = name.lastIndexOf('/');
        const path = name.substr(0, lastSlashIndex);
        // eslint-disable-next-line promise/no-callback-in-promise
        cb(null, {
          destination: path,
          filename: name.substr(lastSlashIndex + 1),
          path,
          size,
          url,
        });
      })
      // eslint-disable-next-line promise/no-callback-in-promise
      .catch(cb);
  }

  _removeFile(req, file, cb) {
    if (!this.client) {
      return cb(ERROR_NO_CLIENT);
    }
    this.client
      .delete(file.filename)
      .then((result) => cb(null, result))
      .catch(cb);
  }
}

export default class extends StorageType {
  static defaults() {
    return {
      title: '阿里云对象存储',
      type: STORAGE_TYPE_ALI_OSS,
      name: 'ali-oss-1',
      baseUrl: process.env.ALI_OSS_STORAGE_BASE_URL,
      options: {
        region: process.env.ALI_OSS_REGION,
        accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
        bucket: process.env.ALI_OSS_BUCKET,
      },
    };
  }

  make() {
    return new AliYunOssStorage({
      config: { timeout: 600_000, ...this.storage.options },
      filename: cloudFilenameGetter(this.storage),
    });
  }
  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    const { client } = this.make();
    const { deleted } = await client.deleteMulti(records.map(getFileKey));
    return [deleted.length, records.filter((record) => !deleted.find((item) => item.Key === getFileKey(record)))];
  }
}
