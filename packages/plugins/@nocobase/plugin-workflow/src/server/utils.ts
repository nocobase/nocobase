/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { isNumeric, parseFilter } from '@nocobase/utils';

export async function parseWorkflowFilter({
  filter,
  collectionInstance,
  scope,
}: {
  filter: any;
  collectionInstance: any;
  scope?: Record<string, any>;
}) {
  if (!filter) {
    return filter;
  }

  const database = collectionInstance?.context?.database;
  const timezone = database?.options?.rawTimezone || database?.options?.timezone;
  const collectionName = collectionInstance?.name;
  const getField = (path: string) => {
    const fieldPath = path
      .split('.')
      .filter((part) => !part.startsWith('$') && !isNumeric(part))
      .join('.');
    return database?.getFieldByPath(`${collectionName}.${fieldPath}`);
  };

  return parseFilter(filter, {
    vars: scope,
    timezone,
    getField,
    now: new Date(),
  });
}

export function toJSON(data: any): any {
  if (Array.isArray(data)) {
    return data.map(toJSON);
  }
  if (!(data instanceof Model) || !data) {
    return data;
  }
  const result = data.get();
  Object.keys((<typeof Model>data.constructor).associations).forEach((key) => {
    if (result[key] != null && typeof result[key] === 'object') {
      result[key] = toJSON(result[key]);
    }
  });
  return result;
}
