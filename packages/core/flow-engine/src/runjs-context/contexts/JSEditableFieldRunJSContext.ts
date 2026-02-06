/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';

/**
 * RunJS context for JSEditableFieldModel (form editable custom field).
 * NOTE: Some APIs (e.g., getValue/setValue/element) are provided by the model's runtime handler.
 * This doc is used for editor autocomplete and AI coding assistance.
 */
export class JSEditableFieldRunJSContext extends FlowRunJSContext {}

JSEditableFieldRunJSContext.define({
  label: 'JSEditableField RunJS context',
  properties: {
    element: {
      description:
        'ElementProxy instance providing a safe DOM container for field rendering. In editable mode this container is typically a <span> element.',
      detail: 'ElementProxy',
    },
    value: {
      description:
        'Current field value (read-only snapshot). In editable scenarios, prefer ctx.getValue()/ctx.setValue(v) for two-way binding.',
      detail: 'any',
      examples: ['const v = ctx.getValue?.() ?? ctx.value;', 'ctx.setValue?.("new value");'],
    },
    record: {
      description: 'Current record data object (read-only). Available in forms that are bound to a record.',
      detail: 'Record<string, any>',
    },
    form: {
      description: 'Ant Design Form instance for reading/writing other fields. Example: ctx.form.getFieldValue("name")',
      detail: 'FormInstance',
    },
    formValues: {
      description:
        'Snapshot of current form values (object). Prefer ctx.form.getFieldsValue() when you need the latest values.',
      detail: 'Record<string, any>',
    },
    namePath: {
      description: 'Field namePath in the form (array). Useful for advanced Form operations.',
      detail: 'Array<string | number>',
    },
    disabled: 'Whether the field is disabled (boolean).',
    readOnly: 'Whether the field is read-only (boolean).',
  },
  methods: {
    getValue: {
      description: 'Get current field value (recommended for editable custom fields).',
      detail: '() => any',
      completion: { insertText: 'ctx.getValue?.()' },
    },
    setValue: {
      description: 'Set current field value (two-way binding with the form).',
      detail: '(value: any) => void',
      completion: { insertText: 'ctx.setValue?.(value)' },
      examples: ['ctx.setValue?.(e.target.value);'],
    },
  },
});

JSEditableFieldRunJSContext.define(
  {
    label: 'JS 可编辑字段 RunJS 上下文',
    properties: {
      element: {
        description: 'ElementProxy，字段渲染的安全容器（通常为 <span> 容器）。',
        detail: 'ElementProxy',
      },
      value: {
        description: '字段当前值（只读快照）。可编辑场景建议使用 ctx.getValue()/ctx.setValue(v) 做双向绑定。',
        detail: 'any',
        examples: ['const v = ctx.getValue?.() ?? ctx.value;', 'ctx.setValue?.("新值");'],
      },
      record: { description: '当前记录对象（只读；表单绑定记录时可用）。', detail: 'Record<string, any>' },
      form: { description: 'Ant Design Form 实例，可读写其它字段。', detail: 'FormInstance' },
      formValues: {
        description: '当前表单值快照（对象）。需要最新值可用 ctx.form.getFieldsValue()。',
        detail: 'Record<string, any>',
      },
      namePath: { description: '字段在表单中的 namePath（数组）。', detail: 'Array<string | number>' },
      disabled: '是否禁用（boolean）',
      readOnly: '是否只读（boolean）',
    },
    methods: {
      getValue: {
        description: '获取字段当前值（可编辑字段推荐使用）。',
        detail: '() => any',
        completion: { insertText: 'ctx.getValue?.()' },
      },
      setValue: {
        description: '设置字段当前值（与表单双向绑定）。',
        detail: '(value: any) => void',
        completion: { insertText: 'ctx.setValue?.(value)' },
        examples: ['ctx.setValue?.(e.target.value);'],
      },
    },
  },
  { locale: 'zh-CN' },
);
