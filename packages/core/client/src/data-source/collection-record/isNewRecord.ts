/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { untracked } from '@formily/reactive';
import { isObject } from 'lodash';

const key = '__isNewRecord__';

/**
 * 判断一个记录对象是否是新记录，可通过 markRecordAsNew 标记
 * @param record
 * @returns
 */
export const isNewRecord = (record: object) => {
  return untracked(() => !!record?.[key]);
};

/**
 * 将一个记录对象标记为新记录，可通过 isNewRecord 判断
 * @param record
 * @returns
 */
export const markRecordAsNew = (record: object) => {
  if (!isObject(record)) throw new Error('markRecordAsNew: record must be an object');

  record[key] = true;
  return record;
};
