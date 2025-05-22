/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'storages',
  shared: true,
  fields: [
    {
      title: '存储引擎名称',
      comment: '存储引擎名称',
      type: 'string',
      name: 'title',
      translation: true,
      trim: true,
    },
    {
      title: '英文标识',
      // comment: '英文标识，用于代码层面配置',
      type: 'uid',
      name: 'name',
      unique: true,
      trim: true,
    },
    {
      comment: '类型标识，如 local/ali-oss 等',
      type: 'string',
      name: 'type',
    },
    {
      comment: '配置项',
      type: 'jsonb',
      name: 'options',
      defaultValue: {},
    },
    {
      comment: '文件规则',
      type: 'jsonb',
      name: 'rules',
      defaultValue: {},
    },
    {
      comment: '存储相对路径模板',
      type: 'text',
      name: 'path',
      defaultValue: '',
      trim: true,
    },
    {
      comment: '访问地址前缀',
      type: 'string',
      name: 'baseUrl',
      defaultValue: '',
      trim: true,
    },
    // TODO(feature): 需要使用一个实现了可设置默认值的字段
    {
      comment: '默认引擎',
      type: 'radio',
      name: 'default',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'paranoid',
      defaultValue: false,
    },
  ],
};
