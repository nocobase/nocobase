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
  snippets: {
    'Show record id': { $ref: 'scene/actions/record-id-message', prefix: 'sn-act-record-id' },
    'Run action': { $ref: 'scene/actions/run-action-basic', prefix: 'sn-act-run' },
  },
});
