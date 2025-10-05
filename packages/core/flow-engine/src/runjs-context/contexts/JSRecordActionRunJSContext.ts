/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSRecordActionRunJSContext extends FlowRunJSContext {}

JSRecordActionRunJSContext.define({
  label: 'JSRecordAction RunJS context',
  properties: {
    record: `Current record data object (read-only).
      Contains all field values of the record associated with this action.`,
    filterByTk: `Primary key or filter key of the current record (read-only).
      Used to identify the specific record in database operations.`,
  },
});

JSRecordActionRunJSContext.define(
  {
    label: 'JS 记录动作 RunJS 上下文',
    properties: {
      record: '当前记录（只读）',
      filterByTk: '主键/过滤键（只读）',
    },
  },
  { locale: 'zh-CN' },
);
