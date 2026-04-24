/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { PlainObject, TemplateName, uniqueByName, toDisplayTitle } from './constants';
import { normalizeFieldInput } from './fields';

function buildPresetFields(options: {
  includeId?: boolean;
  includeCreatedAt?: boolean;
  includeCreatedBy?: boolean;
  includeUpdatedAt?: boolean;
  includeUpdatedBy?: boolean;
}) {
  const fields: PlainObject[] = [];

  if (options.includeId) {
    fields.push(normalizeFieldInput({ name: 'id', interface: 'snowflakeId', title: 'ID' }));
  }
  if (options.includeCreatedAt) {
    fields.push(normalizeFieldInput({ name: 'createdAt', interface: 'createdAt', title: 'Created at' }));
  }
  if (options.includeCreatedBy) {
    fields.push(normalizeFieldInput({ name: 'createdBy', interface: 'createdBy', title: 'Created by' }));
  }
  if (options.includeUpdatedAt) {
    fields.push(normalizeFieldInput({ name: 'updatedAt', interface: 'updatedAt', title: 'Last updated at' }));
  }
  if (options.includeUpdatedBy) {
    fields.push(normalizeFieldInput({ name: 'updatedBy', interface: 'updatedBy', title: 'Last updated by' }));
  }

  return fields;
}

export function buildTemplateBaseline(input: PlainObject) {
  const template = (input.template || 'general') as TemplateName;
  const name = input.name;
  const titleField = input.titleField || 'title';

  switch (template) {
    case 'general':
      return {
        template,
        logging: input.logging ?? true,
        autoGenId: false,
        fields: buildPresetFields({
          includeId: true,
          includeCreatedAt: true,
          includeCreatedBy: true,
          includeUpdatedAt: true,
          includeUpdatedBy: true,
        }),
      };
    case 'tree':
      return {
        template,
        logging: input.logging ?? true,
        view: false,
        tree: input.tree || 'adjacencyList',
        autoGenId: false,
        fields: [
          normalizeFieldInput({
            name: 'parentId',
            interface: 'integer',
            type: 'bigInt',
            isForeignKey: true,
            autoFill: false,
            title: 'Parent ID',
          }),
          normalizeFieldInput({
            name: 'parent',
            interface: 'm2o',
            target: name,
            foreignKey: 'parentId',
            treeParent: true,
            onDelete: 'CASCADE',
            targetTitleField: titleField,
            title: 'Parent',
          }),
          normalizeFieldInput({
            name: 'children',
            interface: 'o2m',
            target: name,
            foreignKey: 'parentId',
            treeChildren: true,
            onDelete: 'CASCADE',
            targetTitleField: titleField,
            title: 'Children',
          }),
          ...buildPresetFields({
            includeId: true,
            includeCreatedAt: true,
            includeCreatedBy: true,
            includeUpdatedAt: true,
            includeUpdatedBy: true,
          }),
        ],
      };
    case 'file':
      return {
        template,
        logging: input.logging ?? true,
        view: false,
        createdBy: true,
        updatedBy: true,
        fields: [
          normalizeFieldInput({ name: 'title', interface: 'input', title: 'Title' }),
          normalizeFieldInput({ name: 'filename', interface: 'input', title: 'File name' }),
          normalizeFieldInput({ name: 'extname', interface: 'input', title: 'Extension name' }),
          normalizeFieldInput({ name: 'size', interface: 'integer', type: 'integer', title: 'Size' }),
          normalizeFieldInput({ name: 'mimetype', interface: 'input', title: 'MIME type' }),
          normalizeFieldInput({ name: 'path', interface: 'textarea', type: 'text', title: 'Path' }),
          normalizeFieldInput({ name: 'url', interface: 'url', type: 'text', title: 'URL' }),
          normalizeFieldInput({ name: 'preview', interface: 'url', type: 'text', field: 'url', title: 'Preview' }),
          normalizeFieldInput({
            name: 'storage',
            interface: 'm2o',
            target: 'storages',
            foreignKey: 'storageId',
            targetTitleField: 'title',
            title: 'Storage',
          }),
          normalizeFieldInput({
            name: 'meta',
            interface: 'json',
            type: 'jsonb',
            defaultValue: {},
            title: 'Meta',
          }),
          ...buildPresetFields({
            includeId: true,
            includeCreatedAt: true,
            includeCreatedBy: true,
            includeUpdatedAt: true,
            includeUpdatedBy: true,
          }),
        ],
      };
    case 'calendar':
      return {
        template,
        logging: input.logging ?? true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
        sortable: input.sortable ?? true,
        fields: [
          normalizeFieldInput({
            name: 'cron',
            interface: 'select',
            type: 'string',
            title: 'Repeats',
            uiSchema: {
              type: 'string',
              title: 'Repeats',
              'x-component': 'CronSet',
              'x-component-props': 'allowClear',
              enum: [
                { label: 'Daily', value: '0 0 0 * * ?' },
                { label: 'Weekly', value: 'every_week' },
                { label: 'Monthly', value: 'every_month' },
                { label: 'Yearly', value: 'every_year' },
              ],
            },
          }),
          normalizeFieldInput({
            name: 'exclude',
            interface: 'json',
            type: 'json',
            title: 'Exclude',
          }),
          ...buildPresetFields({
            includeId: true,
            includeCreatedAt: true,
            includeCreatedBy: true,
            includeUpdatedAt: true,
            includeUpdatedBy: true,
          }),
        ],
      };
    case 'view':
      return { template, view: true, schema: input.schema || 'public' };
    case 'inherit':
      return { template, inherits: input.inherits };
    case 'sql':
    default:
      return { template };
  }
}

export function normalizeCollectionInput(input: PlainObject, options: { mode?: 'create' | 'update' } = {}) {
  const values = _.cloneDeep(input || {});

  if ((options.mode || 'create') === 'create') {
    values.template = values.template || 'general';
    values.title = values.title || toDisplayTitle(values.name);
  }

  if (Array.isArray(values.fields)) {
    values.fields = values.fields.map((field) => normalizeFieldInput(field, { collectionName: values.name }));
  }

  if ((options.mode || 'create') === 'create' && !values.titleField) {
    const primaryKeyField = values.fields?.find?.((field) => field?.primaryKey === true);
    if (primaryKeyField?.name) {
      values.titleField = primaryKeyField.name;
    }
  }

  return values;
}

export function composeCollectionDefinition(input: PlainObject, options: { mode?: 'create' | 'update' } = {}) {
  const baseline: PlainObject = options.mode === 'create' ? buildTemplateBaseline(input) : {};
  const baselineFields = Array.isArray(baseline.fields) ? (baseline.fields as PlainObject[]) : [];
  const inputFields = Array.isArray(input.fields) ? (input.fields as PlainObject[]) : [];

  return normalizeCollectionInput(
    {
      ...baseline,
      ...input,
      fields: uniqueByName([...baselineFields, ...inputFields]),
    },
    options,
  );
}
