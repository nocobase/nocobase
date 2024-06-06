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

export function getNewSchema(fieldSchema: ISchema, schemaKey: string, value: any) {
  const schemaKeyArr = schemaKey.split('.');
  const clonedSchema = _.cloneDeep(fieldSchema[schemaKeyArr[0]]);
  _.set(clonedSchema, schemaKeyArr.slice(1), value);
  return {
    'x-uid': fieldSchema['x-uid'],
    [schemaKeyArr[0]]: clonedSchema,
  };
}

export const useHookDefault = (defaultValues?: any) => defaultValues;
