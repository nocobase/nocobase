/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';

export class JSRecordActionRunJSContext extends FlowRunJSContext {}

JSRecordActionRunJSContext.define({
  label: 'JSRecordAction RunJS context',
  properties: {
    record: '当前记录（只读）',
    filterByTk: '主键/过滤键（只读）',
  },
  methods: {
    runAction: 'Run action: `await ctx.runAction(name, params)`',
    message: 'Message API',
  },
  snipastes: {
    'Show record id': { $ref: 'scene/actions/record-id-message', prefix: 'sn-act-record-id' },
    'Run action': { $ref: 'scene/actions/run-action-basic', prefix: 'sn-act-run' },
  },
});
