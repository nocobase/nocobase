/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const field_o2o = {
  foreignKey: 'fk_table_b',
  onDelete: 'SET NULL',
  name: 'field_o2o',
  type: 'hasOne',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_o2o',
  },
  interface: 'oho',
  target: 'table_a',
  collectionName: 'table_b',
};
