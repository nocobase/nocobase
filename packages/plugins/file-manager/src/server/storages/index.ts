import { StorageEngine } from 'multer';
import Application from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import local from './local';
import oss from './ali-oss';
import s3 from './s3';
import cos from './tx-cos';

import { STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';

export interface StorageModel {
  title: string;
  type: string;
  name: string;
  baseUrl: string;
  options: { [key: string]: string };
  deleteFileOnDestroy?: boolean;
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

const storageTypes = new Registry<IStorage>();
storageTypes.register(STORAGE_TYPE_LOCAL, local);
storageTypes.register(STORAGE_TYPE_ALI_OSS, oss);
storageTypes.register(STORAGE_TYPE_S3, s3);
storageTypes.register(STORAGE_TYPE_TX_COS, cos);

export function getStorageConfig(key: string): IStorage {
  return storageTypes.get(key);
}

export default storageTypes;
