/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL } from '@nocobase/utils';
import { StorageEngine } from 'multer';
import urlJoin from 'url-join';
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

  getFileKey(record: AttachmentModel) {
    return getFileKey(record);
  }

  getFileData?(file: { [key: string]: any }): { [key: string]: any };
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
}

export type StorageClassType = { new (storage: StorageModel): StorageType } & typeof StorageType;
