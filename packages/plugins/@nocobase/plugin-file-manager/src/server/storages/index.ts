/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Path from 'path';
import type { Readable } from 'stream';
import { StorageEngine } from 'multer';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import urlJoin from 'url-join';
import { isURL } from '@nocobase/utils';
import { encodeURL, ensureUrlEncoded, getFileKey } from '../utils';

export interface StorageModel {
  id?: number;
  title: string;
  type: string;
  name: string;
  baseUrl: string;
  options: Record<string, any>;
  rules?: Record<string, any>;
  path?: string;
  default?: boolean;
  paranoid?: boolean;
}

export interface AttachmentModel {
  title: string;
  filename: string;
  path: string;
  url: string;
  storageId: number;
}

export abstract class StorageType {
  static defaults(): StorageModel {
    return {} as StorageModel;
  }
  static filenameKey?: string;
  constructor(public storage: StorageModel) {}
  abstract make(): StorageEngine;
  abstract delete(records: AttachmentModel[]): [number, AttachmentModel[]] | Promise<[number, AttachmentModel[]]>;
  abstract getFileStream(file: AttachmentModel): Promise<{ stream: Readable }>;

  getFileKey(record: AttachmentModel) {
    return getFileKey(record);
  }

  getFileData(file, meta = {}) {
    const { [(this.constructor as typeof StorageType).filenameKey || 'filename']: name } = file;
    // make compatible filename across cloud service (with path)
    const filename = Path.basename(name);
    const extname = Path.extname(filename);
    const path = (this.storage.path || '').replace(/^\/|\/$/g, '');

    const data = {
      title: Buffer.from(file.originalname, 'latin1').toString('utf8').replace(extname, ''),
      filename,
      extname,
      // TODO(feature): 暂时两者相同，后面 storage.path 模版化以后，这里只是 file 实际的 path
      path,
      size: file.size,
      mimetype: file.mimetype,
      meta,
      storageId: this.storage.id,
    };

    return data;
  }

  getFileURL(file: AttachmentModel, preview?: boolean): string | Promise<string> {
    // 兼容历史数据
    if (file.url && isURL(file.url)) {
      if (preview) {
        return encodeURL(file.url) + (this.storage.options.thumbnailRule || '');
      }
      return encodeURL(file.url);
    }
    const keys = [
      this.storage.baseUrl,
      file.path && encodeURI(file.path),
      ensureUrlEncoded(file.filename),
      preview && this.storage.options.thumbnailRule,
    ].filter(Boolean);
    return urlJoin(keys);
  }

  async getFileStreamFromURL(url: string): Promise<{ stream: Readable; contentType: string }> {
    if (url.startsWith('http')) {
      const requestOptions: AxiosRequestConfig = {
        responseType: 'stream',
        validateStatus: (status) => status === 200,
        timeout: 30000, // 30 seconds timeout
      };

      const response = await axios.get(url, requestOptions);

      return {
        stream: response.data,
        contentType: response.headers['content-type'],
      };
    }
    throw new Error('Unsupported URL');
  }
}

export type StorageClassType = { new (storage: StorageModel): StorageType } & typeof StorageType;
