import { Schema, observer, useFieldSchema, useField, RecursionField } from '@formily/react';

function findByUid(schema: Schema, uid: string) {
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
