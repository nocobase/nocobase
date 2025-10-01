/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';

export class JSCollectionActionRunJSContext extends FlowRunJSContext {}

JSCollectionActionRunJSContext.define({
  label: 'JSCollectionAction RunJS context',
  properties: {
    resource: '列表资源（选中行/分页等）',
  },
  methods: {
    runAction: 'Run action',
    message: 'Message API',
  },
  snipastes: {
    'Selected count': { $ref: 'scene/actions/collection-selected-count', prefix: 'sn-act-selected-count' },
    'Iterate selected rows': { $ref: 'scene/actions/iterate-selected-rows', prefix: 'sn-act-iterate' },
  },
});
