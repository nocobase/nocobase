/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type CollectionLike = { filterTargetKey?: string | string[]; getPrimaryKey?: () => string };

export function getUniqueKeyFromCollection(collection: CollectionLike) {
  if (collection?.filterTargetKey) {
    if (Array.isArray(collection.filterTargetKey)) {
      return collection?.filterTargetKey?.[0];
    }
    return collection?.filterTargetKey;
  }
  return collection?.getPrimaryKey() || 'id';
}
