/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { every, findIndex, some } from 'lodash';
import { getValuesByPath, uid } from '@nocobase/utils/client';

export const getPageSchema = (schema: any) => {
  if (schema?.['x-component'] === 'Page') {
    return schema;
  }
  if (schema?.parent) {
    return getPageSchema(schema?.parent);
  }
  return undefined;
};

function getAllKeys(obj) {
  const keys = [];
  function traverse(o) {
    Object.keys(o)
      .sort()
      .forEach(function (key) {
        keys.push(key);
        if (o[key] && typeof o[key] === 'object') {
          traverse(o[key]);
        }
      });
  }
  traverse(obj);
  return keys;
}

const getTargetField = (obj) => {
  const keys = getAllKeys(obj);
  const index = findIndex(keys, (key, index, keys) => {
    if (key.includes('$') && index > 0) {
      return true;
    }
  });
  const result = keys.slice(0, index);
  return result;
};

export function getFieldValuesInCondition({ linkageRules, formValues }) {
  return linkageRules.map((rule) => {
    const run = (condition) => {
      const type = Object.keys(condition)[0] || '$and';
      const conditions = condition[type];

      return conditions
        .map((condition) => {
          if ('$and' in condition || '$or' in condition) {
            return run(condition);
          }

          const path = getTargetField(condition).join('.');
          return getValuesByPath(formValues, path);
        })
        .filter(Boolean);
    };

    return run(rule.condition);
  });
}

export function getConditionResult({ condition, values }) {
  const run = (condition) => {
    const type = Object.keys(condition)[0] || '$and';
    const conditions = condition[type];

    const ress = conditions.map((condition) => {
      if ('$and' in condition || '$or' in condition) {
        return run(condition);
      }

      const path = getTargetField(condition).join('.');
      console.log('path', path, values);
      const v = getValuesByPath(values, path);
      console.log('v', v);
      return v;
    });
    if (type === '$and') {
      return every(ress, Boolean);
    }
    if (type === '$or') {
      return some(ress, Boolean);
    }
  };

  return run(condition);
}
