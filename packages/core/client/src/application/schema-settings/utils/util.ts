/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import _ from 'lodash';

type IGetNewSchema = {
  fieldSchema: ISchema;
  // x-component-props.title
  schemaKey?: string;
  // x-component-props
  parentSchemaKey?: string;
  value: any;
  valueKeys?: string[];
};

export function getNewSchema(options: IGetNewSchema) {
  const { fieldSchema, schemaKey, parentSchemaKey, value, valueKeys } = options as any;
  const clonedKey = schemaKey ? schemaKey.split('.')[0] : parentSchemaKey;
  const fieldSchemaClone = _.cloneDeep(_.get(fieldSchema, clonedKey));
  const res = {
    'x-uid': fieldSchema['x-uid'],
  };
  _.set(res, clonedKey, fieldSchemaClone);
  console.log('getNewSchema', res);
  if (schemaKey) {
    _.set(res, schemaKey, value);
  } else if (parentSchemaKey) {
    if (value == undefined) return res;

    if (typeof value === 'object') {
      Object.keys(value).forEach((key) => {
        if (valueKeys && !valueKeys.includes(key)) return;
        _.set(res, `${parentSchemaKey}.${key}`, value[key]);
      });
    } else {
      console.error('value must be object');
    }
  }

  return res;
}

export const useHookDefault = (defaultValues?: any) => defaultValues;
