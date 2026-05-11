/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FILE_SIZE_LIMIT_DEFAULT,
  STORAGE_TYPE_ALI_OSS,
  STORAGE_TYPE_LOCAL,
  STORAGE_TYPE_S3,
  STORAGE_TYPE_TX_COS,
} from '../../constants';
import { storageFormRegistry } from './registry';

const commonDefaults = {
  renameMode: 'appendRandomID',
  rules: { size: FILE_SIZE_LIMIT_DEFAULT },
};

storageFormRegistry.register({
  name: STORAGE_TYPE_LOCAL,
  title: 'Local storage',
  formLoader: () => import('./LocalStorageForm'),
  defaultValues: {
    ...commonDefaults,
    baseUrl: '/storage/uploads',
    options: { documentRoot: 'storage/uploads' },
  },
});

storageFormRegistry.register({
  name: STORAGE_TYPE_ALI_OSS,
  title: 'Aliyun OSS',
  formLoader: () => import('./AliOssStorageForm'),
  defaultValues: {
    ...commonDefaults,
    options: { timeout: 600_000 },
    settings: { requestOptions: {} },
  },
});

storageFormRegistry.register({
  name: STORAGE_TYPE_S3,
  title: 'Amazon S3',
  formLoader: () => import('./S3StorageForm'),
  defaultValues: commonDefaults,
});

storageFormRegistry.register({
  name: STORAGE_TYPE_TX_COS,
  title: 'Tencent COS',
  formLoader: () => import('./TxCosStorageForm'),
  defaultValues: commonDefaults,
});

export { storageFormRegistry } from './registry';
export type { StorageFormDefinition } from './registry';
