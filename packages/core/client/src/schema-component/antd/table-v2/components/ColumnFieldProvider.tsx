/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useCollection } from '../../../../data-source';
import { NocoBaseRecursionField } from '../../../../formily/NocoBaseRecursionField';
import { useRecord } from '../../../../record-provider';

export const ColumnFieldProvider = (props: { schema: any; basePath: any; children: any }) => {
  const { schema, basePath } = props;
  const record = useRecord();
  const collection = useCollection();
  const fieldSchema = useMemo(
    () =>
      schema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'CollectionField') {
          return s;
        }
        return buf;
      }, null),
    [schema],
  );

  const collectionField = fieldSchema && collection.getField(fieldSchema['x-collection-field']);

  if (
    fieldSchema &&
    record?.__collection &&
    collectionField &&
    ['select', 'multipleSelect'].includes(collectionField.interface)
  ) {
    const fieldName = `${record.__collection}.${fieldSchema.name}`;
    const newSchema = {
      ...schema.toJSON(),
      properties: {
        [fieldSchema.name]: {
          ...fieldSchema.toJSON(),
          'x-collection-field': fieldName,
        },
      },
    };
    return <NocoBaseRecursionField basePath={basePath} schema={newSchema} onlyRenderProperties isUseFormilyField />;
  }
  return props.children;
};
