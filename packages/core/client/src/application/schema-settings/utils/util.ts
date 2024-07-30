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
  schemaKey?: string;
  parentSchemaKey?: string;
  value: any;
  valueKeys?: string[];
};

export function getNewSchema(options: IGetNewSchema) {
  const { fieldSchema, schemaKey, value, valueKeys } = options as any;
  const schemaKeyArr = schemaKey.split('.');
  const clonedSchema = _.cloneDeep(fieldSchema[schemaKeyArr[0]] || {});

  if (value != undefined && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      if (valueKeys && !valueKeys.includes(key)) return;
      _.set(clonedSchema, `${schemaKeyArr.slice(1).join('.')}${schemaKeyArr.length > 1 ? '.' : ''}${key}`, value[key]);
    });
  } else {
    _.set(fieldSchema, schemaKey, value);
  }
  return fieldSchema;
}

export const useHookDefault = (defaultValues?: any) => defaultValues;
