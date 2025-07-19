/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import aliOss from './ali-oss';
import local from './local';
import minio from './minio';
import s3 from './s3';
import txCos from './tx-cos';

export const storageTypes = {
  local: local,
  'ali-oss': aliOss,
  s3: s3,
  'tx-cos': txCos,
  minio: minio,
};
