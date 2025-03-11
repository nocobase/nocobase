/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';
import { StorageEngine } from 'multer';

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

  getFileData?(file: { [key: string]: any }): { [key: string]: any };
  getFileURL(file: AttachmentModel): string | Promise<string> {
    return file.url;
  }
}

export type StorageClassType = { new (storage: StorageModel): StorageType } & typeof StorageType;
