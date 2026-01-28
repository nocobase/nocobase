/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

export class FormJSFieldItemRunJSContext extends FlowRunJSContext {}

FormJSFieldItemRunJSContext.define({
  label: 'FormJSFieldItem RunJS context',
  properties: {
    element: `ElementProxy instance providing a safe DOM container for form field rendering.
      Supports innerHTML, append, and other DOM manipulation methods.`,
    value: `Current field value (read-only in display mode; in controlled scenarios, use setProps to modify).`,
    record: `Current record data object (read-only).
      Contains all field values of the parent record.`,
    formValues: {
      description: 'Snapshot of current form values (object). Available in form contexts (CreateForm/EditForm).',
      detail: 'Record<string, any>',
      examples: ['const { name, status } = ctx.formValues || {};'],
    },
  },
  methods: {
    onRefReady: `Wait for form field container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void`,
    setProps: `Set form field properties programmatically.
      Parameters: (fieldModel: any, props: { value?: any, disabled?: boolean, visible?: boolean }) => void
      Example: ctx.setProps(fieldModel, { value: "new value" })`,
  },
});

FormJSFieldItemRunJSContext.define(
  {
    label: '表单 JS 字段项 RunJS 上下文',
    properties: {
      element: 'ElementProxy，表单字段容器',
      value: '字段值（展示模式为只读；受控场景用 setProps 修改）',
      record: '当前记录（只读）',
      formValues: {
        description: '当前表单值快照（对象）。仅表单相关上下文可用（Create/Edit Form）。',
        detail: 'Record<string, any>',
        examples: ['const { name, status } = ctx.formValues || {};'],
      },
    },
    methods: {
      onRefReady: '容器就绪回调',
      setProps: '设置表单项属性：`setProps(fieldModel, { value })`（由联动/表单上下文提供）',
    },
  },
  { locale: 'zh-CN' },
);
