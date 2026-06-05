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
});

JSCollectionActionRunJSContext.define(
  {
    label: 'JS 集合动作 RunJS 上下文',
    properties: {
      resource: '列表资源（包含选中行/分页信息等）',
    },
  },
  { locale: 'zh-CN' },
);
