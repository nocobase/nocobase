/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSCollectionActionRunJSContext extends FlowRunJSContext {}

JSCollectionActionRunJSContext.define({
  label: 'JSCollectionAction RunJS context',
  properties: {
    resource: `Collection resource instance providing access to selected rows, pagination, and data operations.
      Use ctx.resource.selectedRows to get selected records.
      Use ctx.resource.pagination for page info.`,
  },
  snippets: {
    'Selected count': { $ref: 'scene/actions/collection-selected-count', prefix: 'sn-act-selected-count' },
    'Iterate selected rows': { $ref: 'scene/actions/iterate-selected-rows', prefix: 'sn-act-iterate' },
  },
});
