/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '../../../data-source';

export function getUniqueKeyFromCollection(collection: Collection) {
  if (collection?.filterTargetKey) {
    if (Array.isArray(collection.filterTargetKey)) {
      return collection?.filterTargetKey?.[0];
    }
    return collection?.filterTargetKey;
  }
  return collection?.getPrimaryKey() || 'id';
}
