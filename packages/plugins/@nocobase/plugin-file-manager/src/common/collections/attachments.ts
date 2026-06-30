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
  dumpRules: {
    group: 'user',
  },
  migrationRules: ['schema-only', 'overwrite'],
  asStrategyResource: true,
  uiManageable: true,
  shared: true,
  name: 'attachments',
  title: `{{t('Attachments', { ns: '${NAMESPACE}' })}}`,
  dataCategory: 'business',
  createdBy: true,
  updatedBy: true,
  template: 'file',
  filterTargetKey: 'id',
  fields: [
    {
      interface: 'snowflakeId',
      type: 'snowflakeId',
      name: 'id',
      autoIncrement: false,
      primaryKey: true,
      allowNull: false,
      deletable: false,
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-component-props': {
          stringMode: true,
          separator: '0.00',
          step: '1',
        },
        'x-validator': 'integer',
        'x-read-pretty': true,
      },
    },
    {
      comment: '用户文件名（不含扩展名）',
      interface: 'input',
      type: 'string',
      name: 'title',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Title")}}',
        'x-component': 'Input',
      },
    },
    {
      comment: '系统文件名（含扩展名）',
      interface: 'input',
      type: 'string',
      name: 'filename',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t('Filename', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '扩展名（含“.”）',
      interface: 'input',
      type: 'string',
      name: 'extname',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t('Extension name', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      comment: '文件体积（字节）',
      interface: 'integer',
      type: 'integer',
      name: 'size',
      deletable: false,
      uiSchema: {
        type: 'number',
        title: `{{t('Size', { ns: '${NAMESPACE}' })}}`,
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
      interface: 'input',
      type: 'string',
      name: 'mimetype',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t('MIME type', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      type: 'belongsTo',
      name: 'storage',
      target: 'storages',
      foreignKey: 'storageId',
      deletable: false,
      interface: 'm2o',
      uiSchema: {
        type: 'object',
        title: `{{t('Storage', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'title',
          },
        },
        'x-read-pretty': true,
      },
    },
    {
      comment: '相对路径（含“/”前缀）',
      interface: 'input',
      type: 'text',
      name: 'path',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t('Path', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'TextAreaWithGlobalScope',
        'x-read-pretty': true,
      },
    },
    {
      comment: '文件预览',
      interface: 'url',
      type: 'text',
      name: 'preview',
      field: 'url',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: `{{t('Preview', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'Preview',
        'x-read-pretty': true,
      },
    },
    {
      comment: '其他文件信息（如图片的宽高）',
      interface: 'json',
      type: 'jsonb',
      name: 'meta',
      deletable: false,
      defaultValue: {},
      uiSchema: {
        type: 'object',
        title: `{{t('Metadata', { ns: '${NAMESPACE}' })}}`,
        'x-component': 'Input.JSON',
        'x-component-props': {
          autoSize: {
            minRows: 5,
          },
        },
        'x-read-pretty': true,
      },
    },
    {
      comment: '网络访问地址',
      interface: 'url',
      type: 'text',
      name: 'url',
      deletable: false,
      uiSchema: {
        type: 'string',
        title: '{{t("URL")}}',
        'x-component': 'Input.URL',
        'x-read-pretty': true,
      },
      // formula: '{{ storage.baseUrl }}{{ path }}/{{ filename }}'
    },
    {
      type: 'belongsTo',
      name: 'createdBy',
      target: 'users',
      foreignKey: 'createdById',
      targetKey: 'id',
      interface: 'createdBy',
      deletable: false,
      uiSchema: {
        type: 'object',
        title: '{{t("Created by")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    },
    {
      type: 'context',
      name: 'createdById',
      dataType: 'bigInt',
      dataIndex: 'state.currentUser.id',
      createOnly: true,
      visible: true,
      index: true,
      deletable: false,
    },
    {
      type: 'belongsTo',
      name: 'updatedBy',
      target: 'users',
      foreignKey: 'updatedById',
      targetKey: 'id',
      interface: 'updatedBy',
      deletable: false,
      uiSchema: {
        type: 'object',
        title: '{{t("Last updated by")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    },
    {
      type: 'context',
      name: 'updatedById',
      dataType: 'bigInt',
      dataIndex: 'state.currentUser.id',
      visible: true,
      index: true,
      deletable: false,
    },
  ],
};
