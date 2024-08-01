/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { encryptSync } from '../utils';

export function getFieldOptions(ctx: any) {
  function getField(fieldPath: string[]) {
    const [collectionName, fieldName, ...resetFieldName] = fieldPath;
    const field = ctx.db.collections.get(collectionName).fields.get(fieldName);
    if (resetFieldName.length) {
      return getField([field.target, ...resetFieldName]);
    }
    return ctx.db.collections.get(collectionName).fields.get(fieldName);
  }

  return getField(ctx.fieldPath.split('.')).options;
}

export function encryptSearchValueSync(str: any, ctx: any) {
  const { iv } = getFieldOptions(ctx);
  let encrypted;
  if (Array.isArray(str)) {
    encrypted = str.map((item) => encryptSync(item, iv));
  } else {
    encrypted = encryptSync(str, iv);
  }
  return encrypted;
}
