/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class JSFieldRunJSContext extends FlowRunJSContext {}

JSFieldRunJSContext.define({
  label: 'JSField RunJS context',
  properties: {
    element: 'ElementProxy，字段渲染容器',
    value: '字段当前值（只读）',
    record: '当前记录（只读）',
    collection: '集合定义（只读）',
  },
  methods: {
    onRefReady: 'Container ready callback',
  },
  snippets: {
    'Render value': { $ref: 'scene/jsfield/innerHTML-value', prefix: 'sn-jsf-value' },
    'Message success': { $ref: 'global/message-success', prefix: 'sn-msg-ok' },
    'Format number': { $ref: 'scene/jsfield/format-number', prefix: 'sn-jsf-num' },
    'Color by value': { $ref: 'scene/jsfield/color-by-value', prefix: 'sn-jsf-color' },
  },
});
