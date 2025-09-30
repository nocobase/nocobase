/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from './FlowRunJSContext';

export class FormJSFieldItemRunJSContext extends FlowRunJSContext {}

FormJSFieldItemRunJSContext.define({
  label: 'FormJSFieldItem RunJS context',
  properties: {
    element: 'ElementProxy，表单字段容器',
    value: '字段值（读/受控场景需通过 setProps 修改）',
    record: '当前记录（只读）',
  },
  methods: {
    onRefReady: '容器就绪回调',
    setProps: '设置表单项属性：`setProps(fieldModel, { value })`（由联动/表单上下文提供）',
  },
  snipastes: {
    显示字段值: { $ref: 'scene/jsfield/innerHTML-value', prefix: 'sn-form-value' },
  },
});
