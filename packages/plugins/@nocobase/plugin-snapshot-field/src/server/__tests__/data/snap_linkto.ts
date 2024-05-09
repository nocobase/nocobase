/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const snap_linkto = {
  name: 'snap_linkto',
  type: 'snapshot',
  uiSchema: {
    'x-component': 'SnapshotRecordPicker',
    'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
    title: 'snap_linkto',
  },
  interface: 'snapshot',
  targetField: 'field_linkto',
  collectionName: 'table_b',
};
