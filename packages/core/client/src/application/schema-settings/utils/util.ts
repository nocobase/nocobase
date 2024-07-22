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
  const { fieldSchema, schemaKey, value, parentSchemaKey, valueKeys } = options;

  if (value != undefined && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      if (valueKeys && !valueKeys.includes(key)) return;
      _.set(fieldSchema, `${parentSchemaKey}.${key}`, value[key]);
    });
  } else {
    _.set(fieldSchema, schemaKey, value);
  }
  return fieldSchema;
}

export const useHookDefault = (defaultValues?: any) => defaultValues;
