/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/react';

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

export const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

export function extractIndex(str) {
  const numbers = [];
  str?.split('.').forEach(function (element) {
    if (!isNaN(element)) {
      numbers.push(String(Number(element) + 1));
    }
  });
  return numbers.join('.');
}
