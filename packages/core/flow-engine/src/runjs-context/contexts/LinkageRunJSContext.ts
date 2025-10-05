/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class LinkageRunJSContext extends FlowRunJSContext {}

LinkageRunJSContext.define({
  label: 'Linkage RunJS context',
  properties: {
    model: `Current block or field model (read-only access).
      Provides access to the Formily form model for the current context.`,
    fields: `Collection of accessible fields in the current form (read-only).
      Use this to access and manipulate other fields in linkage rules.`,
  },
});

LinkageRunJSContext.define(
  {
    label: '联动 RunJS 上下文',
    properties: {
      model: '当前块/字段模型（只读）',
      fields: '可访问的字段集合（只读）',
    },
  },
  { locale: 'zh-CN' },
);
