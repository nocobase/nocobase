/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';

export class LinkageRunJSContext extends FlowRunJSContext {}

LinkageRunJSContext.define({
  label: 'Linkage RunJS context',
  properties: {
    model: '当前块/字段模型（只读访问）',
    fields: '可访问的字段集合（只读）',
  },
  methods: {
    message: 'Message API',
  },
  snipastes: {
    'Set field value': { $ref: 'scene/linkage/set-field-value', prefix: 'sn-link-set' },
    'Toggle visible': { $ref: 'scene/linkage/toggle-visible', prefix: 'sn-link-visibility' },
    'Set disabled': { $ref: 'scene/linkage/set-disabled', prefix: 'sn-link-disable' },
    'Set required': { $ref: 'scene/linkage/set-required', prefix: 'sn-link-required' },
  },
});
