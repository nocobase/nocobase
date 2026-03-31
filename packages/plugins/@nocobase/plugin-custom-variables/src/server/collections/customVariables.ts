/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'customVariables',
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  shared: true,
  autoGenId: false,
  timestamps: true,
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      primaryKey: true,
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Variable Name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'label',
      type: 'string',
      interface: 'input',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Label")}}',
        'x-component': 'Input',
        required: true,
      },
      translation: true,
    },
    {
      name: 'declaredAt',
      type: 'uid',
      interface: 'input',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Declared At")}}',
        'x-component': 'Input',
        'x-disabled': true,
      },
    },
    {
      name: 'type',
      type: 'string',
      interface: 'input',
      allowNull: false,
      defaultValue: 'aggregation',
      uiSchema: {
        type: 'string',
        title: '{{t("Variable Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'options',
      type: 'json',
      interface: 'json',
      defaultValue: {},
      uiSchema: {
        type: 'object',
        title: '{{t("Options")}}',
        'x-component': 'Input.JSON',
        description: '{{t("Variable configuration options")}}',
      },
      // 聚合选项需包含：
      // - collection：数据集合
      // - field：字段名
      // - aggregator：聚合方法 (count, sum, avg, min, max)
      // - filter：过滤条件 (可选)
      // - distinct：是否去重 (可选，默认 false)
      // - precision：精度 (可选，默认 2，适用于 avg)
    },
  ],
});
