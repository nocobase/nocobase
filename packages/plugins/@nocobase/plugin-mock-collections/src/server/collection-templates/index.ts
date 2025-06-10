/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  calendar: (options) => {
    return {
      fields: [
        { name: 'exclude', type: 'json' },
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'startAt', type: 'date', interface: 'datetime' },
        {
          name: 'cron',
          type: 'string',
          uiSchema: {
            type: 'string',
            title: '{{t("Repeats")}}',
            'x-component': 'CronSet',
            'x-component-props': 'allowClear',
            enum: [
              { label: '{{t("Daily")}}', value: '0 0 0 * * ?' },
              { label: '{{t("Weekly")}}', value: 'every_week' },
              { label: '{{t("Monthly")}}', value: 'every_month' },
              { label: '{{t("Yearly")}}', value: 'every_year' },
            ],
          },
          interface: 'select',
        },
      ],
    };
  },
  tree: (options) => {
    return {
      tree: 'adjacencyList',
      fields: [
        {
          interface: 'integer',
          name: 'parentId',
          type: 'bigInt',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: '{{t("Parent ID")}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          interface: 'm2o',
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
          onDelete: 'CASCADE',
          target: options.name,
          uiSchema: {
            title: '{{t("Parent")}}',
            'x-component': 'AssociationField',
            'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
          },
        },
        {
          interface: 'o2m',
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
          onDelete: 'CASCADE',
          target: options.name,
          uiSchema: {
            title: '{{t("Children")}}',
            'x-component': 'AssociationField',
            'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
          },
        },
      ],
    };
  },
  general: () => ({}),
  file: (options) => {
    return {
      template: 'file',
      fields: [
        {
          interface: 'input',
          type: 'string',
          name: 'title',
          deletable: false,
          uiSchema: { type: 'string', title: '{{t("Title")}}', 'x-component': 'Input' },
        },
        {
          interface: 'input',
          type: 'string',
          name: 'filename',
          deletable: false,
          uiSchema: {
            type: 'string',
            title: '{{t("File name", { ns: "file-manager" })}}',
            'x-component': 'Input',
            'x-read-pretty': true,
          },
        },
        {
          interface: 'input',
          type: 'string',
          name: 'extname',
          deletable: false,
          uiSchema: {
            type: 'string',
            title: '{{t("Extension name", { ns: "file-manager" })}}',
            'x-component': 'Input',
            'x-read-pretty': true,
          },
        },
        {
          interface: 'integer',
          type: 'integer',
          name: 'size',
          deletable: false,
          uiSchema: {
            type: 'number',
            title: '{{t("Size", { ns: "file-manager" })}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
            'x-component-props': { stringMode: true, step: '0' },
          },
        },
        {
          interface: 'input',
          type: 'string',
          name: 'mimetype',
          deletable: false,
          uiSchema: {
            type: 'string',
            title: '{{t("MIME type", { ns: "file-manager" })}}',
            'x-component': 'Input',
            'x-read-pretty': true,
          },
        },
        {
          interface: 'input',
          type: 'string',
          name: 'path',
          deletable: false,
          uiSchema: { type: 'string', title: '{{t("Path")}}', 'x-component': 'Input', 'x-read-pretty': true },
        },
        {
          interface: 'input',
          type: 'string',
          name: 'url',
          deletable: false,
          uiSchema: { type: 'string', title: '{{t("URL")}}', 'x-component': 'Input.URL', 'x-read-pretty': true },
        },
        {
          interface: 'url',
          type: 'string',
          name: 'preview',
          field: 'url',
          deletable: false,
          uiSchema: { type: 'string', title: '{{t("Preview")}}', 'x-component': 'Preview', 'x-read-pretty': true },
        },
        {
          comment: '存储引擎',
          type: 'belongsTo',
          name: 'storage',
          target: 'storages',
          foreignKey: 'storageId',
          deletable: false,
        },
        { type: 'jsonb', name: 'meta', deletable: false, defaultValue: {} },
      ],
    };
  },
  expression: () => ({
    template: 'expression',
    fields: [
      {
        name: 'engine',
        type: 'string',
        interface: 'radioGroup',
        uiSchema: {
          type: 'string',
          title: '{{t("Calculation engine")}}',
          'x-component': 'Radio.Group',
          enum: [
            {
              value: 'math.js',
              label: 'Math.js',
              tooltip:
                "{{t('Math.js comes with a large set of built-in functions and constants, and offers an integrated solution to work with different data types')}}",
              link: 'https://mathjs.org/',
            },
            {
              value: 'formula.js',
              label: 'Formula.js',
              tooltip: '{{t("Formula.js supports most Microsoft Excel formula functions.")}}',
              link: 'https://docs.nocobase.com/handbook/calculation-engines/formula',
            },
          ],
          default: 'formula.js',
        },
      },
      {
        name: 'sourceCollection',
        type: 'string',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Collection")}}',
          'x-component': 'CollectionSelect',
          'x-component-props': {},
        },
      },
      {
        name: 'expression',
        type: 'text',
        interface: 'expression',
        uiSchema: { type: 'string', title: '{{t("Expression")}}', 'x-component': 'DynamicExpression' },
      },
    ],
  }),
};
