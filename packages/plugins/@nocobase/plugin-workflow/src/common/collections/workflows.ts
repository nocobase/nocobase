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
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'workflows',
  shared: true,
  repository: 'WorkflowRepository',
  fields: [
    {
      name: 'key',
      type: 'uid',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Name")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: false,
      interface: 'radioGroup',
      uiSchema: {
        title: `{{t("Status", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        enum: [
          { label: `{{t("On", { ns: "${NAMESPACE}" })}}`, value: true, color: '#52c41a' },
          { label: `{{t("Off", { ns: "${NAMESPACE}" })}}`, value: false },
        ],
        'x-component': 'Radio.Group',
        default: false,
      },
    },
    {
      type: 'text',
      name: 'description',
      interface: 'textarea',
      uiSchema: {
        title: '{{t("Description")}}',
        type: 'string',
        'x-component': 'Input.TextArea',
      },
    },
    {
      type: 'string',
      name: 'type',
      required: true,
      interface: 'select',
      uiSchema: {
        title: `{{t("Trigger type", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-component': 'Select',
        enum: '{{useTriggersOptions()}}',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'triggerTitle',
    },
    {
      type: 'jsonb',
      name: 'config',
      required: true,
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'nodes',
      target: 'flow_nodes',
      onDelete: 'CASCADE',
    },
    {
      type: 'hasMany',
      name: 'executions',
    },
    {
      type: 'integer',
      name: 'executed',
      defaultValue: 0,
    },
    {
      type: 'integer',
      name: 'allExecuted',
      defaultValue: 0,
    },
    {
      type: 'boolean',
      name: 'current',
    },
    {
      type: 'boolean',
      name: 'sync',
      defaultValue: false,
      interface: 'radioGroup',
      uiSchema: {
        title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
        type: 'boolean',
        'x-component': 'Radio.Group',
        enum: [
          {
            label: `{{ t("Asynchronously", { ns: "${NAMESPACE}" }) }}`,
            value: false,
            color: 'cyan',
          },
          {
            label: `{{ t("Synchronously", { ns: "${NAMESPACE}" }) }}`,
            value: true,
            color: 'orange',
          },
        ],
        required: true,
      },
    },
    {
      type: 'hasMany',
      name: 'revisions',
      target: 'workflows',
      foreignKey: 'key',
      sourceKey: 'key',
      // NOTE: no constraints needed here because tricky self-referencing
      constraints: false,
      onDelete: 'NO ACTION',
    },
    {
      type: 'jsonb',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasOne',
      name: 'stats',
      target: 'workflowStats',
      foreignKey: 'key',
      sourceKey: 'key',
      constraints: false,
      // interface: 'oho',
      // uiSchema: {
      //   type: 'object',
      //   'x-component': 'AssociationSelect',
      //   'x-component-props': {
      //     fieldNames: {
      //       label: 'executed',
      //       value: 'key',
      //     },
      //   },
      //   'x-read-pretty': true,
      // },
    },
    {
      type: 'hasOne',
      name: 'versionStats',
      target: 'workflowVersionStats',
      foreignKey: 'id',
      sourceKey: 'id',
      constraints: false,
      onDelete: 'CASCADE',
      // interface: 'oho',
      // uiSchema: {
      //   type: 'object',
      //   'x-component': 'AssociationSelect',
      //   'x-component-props': {
      //     fieldNames: {
      //       label: 'executed',
      //       value: 'id',
      //     },
      //   },
      //   'x-read-pretty': true,
      // },
    },
    {
      type: 'belongsToMany',
      name: 'categories',
      target: 'workflowCategories',
      through: 'workflowCategoryRelations',
      foreignKey: 'workflowId',
      otherKey: 'categoryId',
      sourceKey: 'id',
      constraints: false,
      interface: 'm2m',
      uiSchema: {
        type: 'array',
        title: `{{t("Category", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          // objectValue: false,
          fieldNames: {
            label: 'title',
            value: 'id',
            color: 'color',
          },
          mode: 'Tag',
        },
        'x-read-pretty': true,
      },
    },
  ],
  // NOTE: use unique index for avoiding deadlock in mysql when setCurrent
  indexes: [
    {
      unique: true,
      fields: ['key', 'current'],
    },
  ],
};
