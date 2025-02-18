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
}

export interface IStorage {
  filenameKey?: string;
  middleware?(app: Application): void;
  getFileData?(file: { [key: string]: any }): { [key: string]: any };
  make(storage: StorageModel): StorageEngine;
  defaults(): StorageModel;
  delete(storage: StorageModel, records: AttachmentModel[]): Promise<[number, AttachmentModel[]]>;
}

export abstract class StorageType implements IStorage {
  abstract make(storage: StorageModel): StorageEngine;
  abstract delete(storage: StorageModel, records: AttachmentModel[]): Promise<[number, AttachmentModel[]]>;
  defaults(): StorageModel {
    return {} as any;
  }
}
