/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../constants';

export default {
  title: `{{t("Attachments", { ns: "${NAMESPACE}" })}}`,
  dumpRules: {
    group: 'user',
  },
  migrationRules: ['schema-only', 'overwrite'],
  asStrategyResource: true,
  shared: true,
  name: 'attachments',
  createdBy: true,
  updatedBy: true,
  template: 'file',
  filterTargetKey: 'id',
  deletable: false,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      deletable: false,
      interface: 'number',
      autoIncrement: true,
      uiSchema: {
        type: 'number',
        title: `{{t("ID")}}`,
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      },
    },
    {
      comment: '用户文件名（不含扩展名）',
      type: 'string',
      name: 'title',
      deletable: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("Title")}}`,
        'x-component': 'Input',
      },
    },
    {
      comment: '系统文件名（含扩展名）',
      type: 'string',
      name: 'filename',
      deletable: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("File name", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '扩展名（含“.”）',
      type: 'string',
      name: 'extname',
      deletable: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("Extension name", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '文件体积（字节）',
      type: 'integer',
      name: 'size',
      deletable: false,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: `{{t("Size", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'InputNumber',
        'x-read-pretty': true,
        'x-component-props': {
          stringMode: true,
          step: '0',
        },
      },
    },
    // TODO: 使用暂不明确，以后再考虑
    // {
    //   comment: '文件类型（mimetype 前半段，通常用于预览）',
    //   type: 'string',
    //   name: 'type',
    // },
    {
      type: 'string',
      name: 'mimetype',
      deletable: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("MIME type", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '存储引擎',
      type: 'belongsTo',
      name: 'storage',
      deletable: false,
      interface: 'm2o',
      uiSchema: {
        type: 'string',
        title: `{{t("Storage engine", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '相对路径（含“/”前缀）',
      type: 'text',
      name: 'path',
      deletable: false,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: `{{t("Path", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '其他文件信息（如图片的宽高）',
      type: 'jsonb',
      name: 'meta',
      defaultValue: {},
      deletable: false,
      interface: 'json',
      uiSchema: {
        type: 'object',
        title: `{{t("Meta", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input.JSON',
        'x-read-pretty': true,
      },
    },
    {
      comment: '网络访问地址',
      type: 'text',
      name: 'url',
      deletable: false,
      interface: 'url',
      uiSchema: {
        type: 'string',
        title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input.URL',
        'x-read-pretty': true,
      },
    },
    // 用于预览
    {
      interface: 'url',
      type: 'text',
      name: 'preview',
      field: 'url', // 直接引用 url 字段
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t("Preview", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Preview',
        'x-read-pretty': true,
      },
    },
  ],
};
