import local from './local';
import oss from './ali-oss';
import s3 from './s3';
import cos from './tx-cos';

import { STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';

export interface IStorage {
  filenameKey?: string;
  middleware?: Function;
  getFileData?: Function;
  make: Function;
  defaults: Function;
}

const map = new Map<string, IStorage>();
map.set(STORAGE_TYPE_LOCAL, local);
map.set(STORAGE_TYPE_ALI_OSS, oss);
map.set(STORAGE_TYPE_S3, s3);
map.set(STORAGE_TYPE_TX_COS, cos);

export function getStorageConfig(key: string): IStorage {
  return map.get(key);
}
