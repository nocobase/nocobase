/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const field_linkto = {
  name: 'field_linkto',
  type: 'belongsToMany',
  uiSchema: {
    'x-component': 'RecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'field_linkto',
  },
  interface: 'linkTo',
  target: 'table_a',
  collectionName: 'table_b',
};
