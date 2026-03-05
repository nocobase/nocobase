/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const recordPickerVisibleCache = new Map<string, boolean>();

export function getRecordPickerVisibleCacheKey(field: any, fieldSchema: any) {
  return field?.path?.entire || field?.address?.toString?.() || fieldSchema?.['x-uid'] || fieldSchema?.name;
}

export function getRecordPickerVisibleFromCache(key?: string) {
  if (!key) {
    return false;
  }
  return !!recordPickerVisibleCache.get(key);
}

export function setRecordPickerVisibleToCache(key: string, visible: boolean) {
  if (!key) {
    return;
  }
  if (visible) {
    recordPickerVisibleCache.set(key, true);
    return;
  }
  recordPickerVisibleCache.delete(key);
}
