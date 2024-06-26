/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { useColumnSchema } from '../../schema-component/antd/table-v2/Table.Column.Decorator';

/**
 * 是否显示 `允许多选` 开关
 */
export function useIsShowMultipleSwitch() {
  const field = useField();
  const { getCollectionField } = useCollectionManager_deprecated();
  const { fieldSchema: tableColumnSchema } = useColumnSchema();
  const schema = useFieldSchema();
  const fieldSchema = tableColumnSchema || schema;
  const collectionField = fieldSchema['x-collection-field']
    ? getCollectionField(fieldSchema['x-collection-field'])
    : null;
  const uiSchema = collectionField?.uiSchema || fieldSchema;
  const hasMultiple = uiSchema['x-component-props']?.multiple === true;
  const fieldMode = field?.componentProps?.['mode'];
  return function IsShowMultipleSwitch() {
    return !field.readPretty && fieldSchema['x-component'] !== 'TableField' && hasMultiple && fieldMode !== 'SubTable';
  };
}
