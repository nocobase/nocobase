/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';

export class JSItemRunJSContext extends FlowRunJSContext {}

JSItemRunJSContext.define({
  label: 'JSItem RunJS context',
  properties: {
    element: 'ElementProxy，表单项渲染容器',
    resource: '当前资源（只读）',
    record: '当前记录（只读）',
  },
  methods: {
    onRefReady: 'Container ready callback',
    requireAsync: 'Load external library',
  },
  snipastes: {
    'Render form item': { $ref: 'scene/jsitem/render-basic', prefix: 'sn-jsitem-basic' },
  },
});
