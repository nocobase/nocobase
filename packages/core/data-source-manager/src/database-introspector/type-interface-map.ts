/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const typeInterfaceMap = {
  // ---------- JSON / Structured ----------
  array: () => ({
    interface: 'json',
    uiSchema: {
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: { minRows: 5 },
      },
      default: null,
    },
  }),
  json: () => ({
    interface: 'json',
    uiSchema: {
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: { minRows: 5 },
      },
      default: null,
    },
  }),
  jsonb: () => ({
    interface: 'json',
    uiSchema: {
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: { minRows: 5 },
      },
      default: null,
    },
  }),

  // ---------- Date / Time ----------
  date: () => ({
    interface: 'datetime',
    uiSchema: {
      'x-component': 'DatePicker',
      'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: false },
    },
  }),
  datetime: () => ({
    interface: 'datetime',
    uiSchema: {
      'x-component': 'DatePicker',
      'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: false },
    },
  }),
  datetimeTz: () => ({
    interface: 'datetime',
    uiSchema: {
      'x-component': 'DatePicker',
      'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: false },
    },
  }),
  datetimeNoTz: () => ({
    interface: 'datetimeNoTz',
    uiSchema: {
      type: 'string',
      'x-component': 'DatePicker',
      'x-component-props': { showTime: false, utc: false },
    },
  }),
  dateOnly: () => ({
    interface: 'dateOnly',
    uiSchema: {
      type: 'string',
      'x-component': 'DatePicker',
      'x-component-props': { dateOnly: true },
    },
  }),
  time: () => ({
    interface: 'time',
    uiSchema: {
      type: 'string',
      'x-component': 'TimePicker',
      'x-component-props': { format: 'HH:mm:ss' },
    },
  }),

  // ---------- Numeric ----------
  integer: () => ({
    interface: 'integer',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': { stringMode: true, step: '1' },
      'x-validator': 'integer',
    },
  }),
  bigInt: () => ({
    interface: 'integer',
    uiSchema: {
      'x-component': 'InputNumber',
      'x-component-props': {
        style: { width: '100%' },
      },
    },
  }),
  float: () => ({
    interface: 'number',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': { stringMode: true, step: '1' },
    },
  }),
  double: () => ({
    interface: 'number',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': { stringMode: true, step: '1' },
    },
  }),
  real: () => ({
    interface: 'number',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': { stringMode: true, step: '1' },
    },
  }),
  decimal: () => ({
    interface: 'number',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': { stringMode: true, step: '1' },
    },
  }),

  // ---------- Text / String ----------
  string: () => ({
    interface: 'input',
    uiSchema: {
      'x-component': 'Input',
      'x-component-props': {
        style: { width: '100%' },
      },
    },
  }),
  text: () => ({
    interface: 'textarea',
    uiSchema: {
      type: 'string',
      'x-component': 'Input.TextArea',
    },
  }),
  password: () => ({
    interface: 'password',
    hidden: true,
    uiSchema: {
      type: 'string',
      'x-component': 'Password',
    },
  }),
  uid: () => ({
    interface: 'input',
    uiSchema: {
      'x-component': 'Input',
      'x-component-props': {
        style: { width: '100%' },
      },
    },
  }),
  uuid: () => ({
    interface: 'uuid',
    uiSchema: {
      'x-component': 'Input',
      'x-component-props': {
        style: { width: '100%' },
      },
    },
  }),

  // ---------- Boolean ----------
  boolean: () => ({
    interface: 'checkbox',
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  }),

  // ---------- Placeholders (not yet implemented) ----------
  // Relationships
  belongsTo: '',
  belongsToMany: '',
  hasMany: '',
  hasOne: '',
  context: '',
  virtual: '',
  // Other
  radio: '',
  set: '',
  sort: '',
  // Geospatial
  point: '',
  polygon: '',
  lineString: '',
  circle: '',
};
