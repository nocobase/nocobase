/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useColumnSchema } from '../../../schema-component';

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
  if (schemaKey) {
    _.set(fieldSchema, schemaKey, value);
  } else if (parentSchemaKey) {
    if (value == undefined) return fieldSchema;

    if (typeof value === 'object') {
      Object.keys(value).forEach((key) => {
        if (valueKeys && !valueKeys.includes(key)) return;
        _.set(fieldSchema, `${parentSchemaKey}.${key}`, value[key]);
      });
    } else {
      console.error('value must be object');
    }
  }

  return fieldSchema;
}

export const useHookDefault = (defaultValues?: any) => defaultValues;

export const useSchemaByType = (type: 'common' | 'field' = 'common') => {
  const schema = useFieldSchema();
  const { fieldSchema: tableColumnSchema } = useColumnSchema() || {};
  return type === 'field' ? tableColumnSchema || schema : schema;
};
