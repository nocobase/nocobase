/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { merge as deepmerge } from '@nocobase/utils';

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray.concat(destinationArray);

export function merge(obj1: any, obj2: any, opts?: any) {
  return deepmerge(obj1, obj2, {
    arrayMerge: overwriteMerge,
    ...opts,
  });
}
