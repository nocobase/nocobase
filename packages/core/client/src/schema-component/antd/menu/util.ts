/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';

export function findByUid(schema: any, uid: string) {
  if (!Schema.isSchemaInstance(schema)) {
    schema = new Schema(schema);
  }
  return schema.reduceProperties((buffter, s) => {
    if (s['x-uid'] === uid) {
      return s;
    }
    const ss = findByUid(s, uid);
    if (ss) {
      return ss;
    }
    return buffter;
  }, null);
}

export function findMenuItem(schema: any) {
  if (!Schema.isSchemaInstance(schema)) {
    schema = new Schema(schema);
  }
  for (const { schema: s } of Schema.getOrderProperties(schema)) {
    if (s['x-component'] === 'Menu.Item') {
      return s;
    }
    const ss = findMenuItem(s);
    if (ss) {
      return ss;
    }
  }
  return null;
}

function findKeys(schema: Schema) {
  if (!schema) {
    return;
  }
  const keys = [];
  keys.push(schema.name);
  while (schema.parent) {
    if (schema.parent['x-component'] === 'Menu') {
      break;
    }
    keys.push(schema.parent.name);
    schema = schema.parent;
  }
  return keys.reverse();
}

export function findKeysByUid(schema: Schema, uid: string) {
  return findKeys(findByUid(schema, uid));
}
