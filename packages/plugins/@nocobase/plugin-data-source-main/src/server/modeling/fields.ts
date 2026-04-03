/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  ARRAY_DEFAULT_INTERFACES,
  CHOICE_INTERFACES,
  INTERFACE_ALIASES,
  MULTI_COMPONENT_INTERFACES,
  PlainObject,
  RELATION_INTERFACES,
  normalizeChoiceEnum,
  toDisplayTitle,
  uniqueByName,
} from './constants';

export function normalizeInterfaceName(value?: string) {
  if (!value) {
    return value;
  }
  return INTERFACE_ALIASES[value] || value;
}

function buildRelationComponentProps(field: PlainObject) {
  return {
    multiple: MULTI_COMPONENT_INTERFACES.has(field.interface),
    fieldNames: {
      value: field.targetKey || 'id',
      label: field.targetTitleField || 'id',
    },
  };
}

function getFieldType(field: PlainObject) {
  if (field.type) {
    return field.type;
  }

  switch (field.interface) {
    case 'input':
    case 'phone':
    case 'email':
    case 'color':
    case 'icon':
      return 'string';
    case 'url':
    case 'textarea':
    case 'markdown':
    case 'markdownVditor':
    case 'richText':
      return 'text';
    case 'integer':
      return 'bigInt';
    case 'number':
      return 'double';
    case 'percent':
      return 'float';
    case 'password':
      return 'password';
    case 'checkbox':
      return 'boolean';
    case 'select':
    case 'radioGroup':
      return 'string';
    case 'multipleSelect':
    case 'checkboxGroup':
      return 'array';
    case 'json':
      return 'json';
    case 'attachment':
      return 'belongsToMany';
    case 'attachmentURL':
      return 'string';
    case 'datetime':
    case 'createdAt':
    case 'updatedAt':
      return 'date';
    case 'datetimeNoTz':
      return 'datetimeNoTz';
    case 'dateOnly':
      return 'dateOnly';
    case 'time':
      return 'time';
    case 'unixTimestamp':
      return 'unixTimestamp';
    case 'm2o':
    case 'obo':
    case 'createdBy':
    case 'updatedBy':
      return 'belongsTo';
    case 'o2m':
      return 'hasMany';
    case 'm2m':
      return 'belongsToMany';
    case 'oho':
      return 'hasOne';
    case 'chinaRegion':
      return 'belongsToMany';
    case 'snowflakeId':
      return 'snowflakeId';
    case 'id':
      return 'bigInt';
    case 'uuid':
      return 'uuid';
    case 'nanoid':
      return 'nanoid';
    case 'formula':
      return 'formula';
    case 'sort':
      return 'sort';
    case 'code':
      return 'code';
    case 'sequence':
      return 'sequence';
    case 'encryption':
      return 'string';
    case 'tableoid':
      return 'bigInt';
    case 'mbm':
      return 'belongsToArray';
    default:
      return 'string';
  }
}

function isPrimaryKeyLikeField(field: PlainObject) {
  return field.primaryKey === true || field.name === 'id';
}

function buildUiSchema(field: PlainObject) {
  const title = field.title || toDisplayTitle(field.name);

  switch (field.interface) {
    case 'input':
      return { type: 'string', title, 'x-component': 'Input' };
    case 'textarea':
      return { type: 'string', title, 'x-component': 'Input.TextArea' };
    case 'phone':
      return { type: 'string', title, 'x-component': 'Input', 'x-component-props': { type: 'tel' } };
    case 'email':
      return { type: 'string', title, 'x-component': 'Input', 'x-validator': 'email' };
    case 'url':
      return { type: 'string', title, 'x-component': 'Input.URL' };
    case 'integer':
      return {
        type: 'number',
        title,
        'x-component': 'InputNumber',
        'x-component-props': { stringMode: true, step: '1' },
        'x-validator': 'integer',
      };
    case 'number':
      return {
        type: 'number',
        title,
        'x-component': 'InputNumber',
        'x-component-props': { stringMode: true, step: '1' },
      };
    case 'percent':
      return {
        type: 'string',
        title,
        'x-component': 'Percent',
        'x-component-props': { stringMode: true, step: '1', addonAfter: '%' },
      };
    case 'password':
      return { type: 'string', title, 'x-component': 'Password' };
    case 'color':
      return { type: 'string', title, 'x-component': 'ColorSelect' };
    case 'icon':
      return { type: 'string', title, 'x-component': 'IconPicker' };
    case 'checkbox':
      return { type: 'boolean', title, 'x-component': 'Checkbox' };
    case 'select':
      return { type: 'string', title, 'x-component': 'Select', enum: normalizeChoiceEnum(field.enum) };
    case 'multipleSelect':
      return {
        type: 'array',
        title,
        'x-component': 'Select',
        'x-component-props': { mode: 'multiple' },
        enum: normalizeChoiceEnum(field.enum),
      };
    case 'radioGroup':
      return { type: 'string', title, 'x-component': 'Radio.Group', enum: normalizeChoiceEnum(field.enum) };
    case 'checkboxGroup':
      return { type: 'array', title, 'x-component': 'Checkbox.Group', enum: normalizeChoiceEnum(field.enum) };
    case 'chinaRegion':
      return {
        type: 'array',
        title,
        'x-component': 'Cascader',
        'x-component-props': {
          useDataSource: '{{ useChinaRegionDataSource }}',
          useLoadData: '{{ useChinaRegionLoadData }}',
          changeOnSelectLast: false,
          labelInValue: true,
          maxLevel: 3,
          fieldNames: { label: 'name', value: 'code', children: 'children' },
        },
      };
    case 'markdown':
      return { type: 'string', title, 'x-component': 'Markdown' };
    case 'markdownVditor':
      return { type: 'string', title, 'x-component': 'MarkdownVditor' };
    case 'richText':
      return { type: 'string', title, 'x-component': 'RichText' };
    case 'attachment':
      return { type: 'array', title, 'x-component': 'Attachment' };
    case 'attachmentURL':
      return {
        type: 'string',
        title,
        'x-component': 'AttachmentUrl',
        'x-use-component-props': 'useAttachmentUrlFieldProps',
      };
    case 'json':
      return { type: 'object', title, 'x-component': 'Input.JSON', 'x-component-props': { autoSize: { minRows: 5 } } };
    case 'datetime':
      return { type: 'string', title, 'x-component': 'DatePicker', 'x-component-props': { showTime: true, utc: true } };
    case 'datetimeNoTz':
      return {
        type: 'string',
        title,
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true, utc: false },
      };
    case 'dateOnly':
      return {
        type: 'string',
        title,
        'x-component': 'DatePicker',
        'x-component-props': { dateOnly: true, showTime: false },
      };
    case 'time':
      return { type: 'string', title, 'x-component': 'TimePicker' };
    case 'unixTimestamp':
      return {
        type: 'number',
        title,
        'x-component': 'UnixTimestamp',
        'x-component-props': { showTime: true },
        'x-validator': 'timestamp',
      };
    case 'm2o':
    case 'o2m':
    case 'm2m':
    case 'obo':
    case 'oho':
    case 'mbm':
      return {
        type: MULTI_COMPONENT_INTERFACES.has(field.interface) ? 'array' : 'object',
        title,
        'x-component': 'AssociationField',
        'x-component-props': buildRelationComponentProps(field),
      };
    case 'createdAt':
    case 'updatedAt':
      return { type: 'datetime', title, 'x-component': 'DatePicker', 'x-read-pretty': true };
    case 'createdBy':
    case 'updatedBy':
      return {
        type: 'object',
        title,
        'x-component': 'AssociationField',
        'x-component-props': { fieldNames: { value: 'id', label: 'nickname' } },
        'x-read-pretty': true,
      };
    case 'snowflakeId':
      return {
        type: 'number',
        title,
        'x-component': 'InputNumber',
        'x-component-props': { stringMode: true, separator: '0.00', step: '1' },
        'x-validator': 'integer',
      };
    case 'id':
    case 'tableoid':
      return { type: 'number', title, 'x-component': 'InputNumber', 'x-read-pretty': true };
    case 'uuid':
      return { type: 'string', title, 'x-component': 'Input', 'x-validator': 'uuid' };
    case 'nanoid':
      return { type: 'string', title, 'x-component': 'NanoIDInput' };
    case 'formula':
      return { type: 'string', title, 'x-component': 'Formula.Input' };
    case 'sort':
      return { type: 'number', title, 'x-component': 'InputNumber' };
    case 'code':
      return { type: 'string', title, 'x-component': 'CodeEditor' };
    case 'sequence':
      return { type: 'string', title, 'x-component': 'Sequence' };
    default:
      return { type: 'string', title, 'x-component': 'Input' };
  }
}

function buildReverseField(field: PlainObject) {
  if (field.reverseField) {
    return normalizeFieldInput(field.reverseField, { collectionName: field.target });
  }
  if (!field.reverseName) {
    return undefined;
  }

  const reverseInterface =
    field.reverseInterface ||
    {
      m2o: 'o2m',
      o2m: 'm2o',
      m2m: 'm2m',
      obo: 'oho',
      oho: 'obo',
    }[field.interface];

  return normalizeFieldInput(
    {
      name: field.reverseName,
      title: field.reverseTitle,
      interface: reverseInterface,
      target: field.collectionName,
      targetTitleField: field.sourceTitleField || 'id',
      targetKey: field.sourceKey || 'id',
      through: field.through,
      foreignKey: field.otherKey || field.foreignKey,
      otherKey: field.foreignKey || field.otherKey,
    },
    { collectionName: field.target },
  );
}

export function normalizeFieldInput(input: PlainObject, context: PlainObject = {}) {
  const field = _.cloneDeep(input || {});
  field.interface = normalizeInterfaceName(field.interface);
  field.collectionName = field.collectionName || context.collectionName;
  field.title = field.title || field.uiSchema?.title || toDisplayTitle(field.name);
  field.targetTitleField = field.targetTitleField || field.titleField;

  if (!field.interface) {
    throw new Error(`Field ${field.name || '(unknown)'} is missing interface`);
  }

  if (RELATION_INTERFACES.has(field.interface) && !field.target) {
    throw new Error(`Relation field ${field.name} requires target`);
  }

  const normalized: PlainObject = {
    ...field,
    interface: field.interface,
    type: getFieldType(field),
  };

  normalized.uiSchema = _.merge({}, buildUiSchema(normalized), field.uiSchema || {});

  if (CHOICE_INTERFACES.has(normalized.interface)) {
    normalized.enum = normalizeChoiceEnum(normalized.enum || normalized.uiSchema?.enum || []);
    normalized.uiSchema.enum = normalized.enum;
  }

  if (ARRAY_DEFAULT_INTERFACES.has(normalized.interface) && normalized.defaultValue === undefined) {
    normalized.defaultValue = [];
  }

  if (normalized.interface === 'createdAt') {
    normalized.field = normalized.field || 'createdAt';
  }
  if (normalized.interface === 'updatedAt') {
    normalized.field = normalized.field || 'updatedAt';
  }
  if (normalized.interface === 'createdBy') {
    normalized.target = normalized.target || 'users';
    normalized.foreignKey = normalized.foreignKey || 'createdById';
  }
  if (normalized.interface === 'updatedBy') {
    normalized.target = normalized.target || 'users';
    normalized.foreignKey = normalized.foreignKey || 'updatedById';
  }
  if (normalized.interface === 'attachment') {
    normalized.target = normalized.target || 'attachments';
  }
  if (normalized.interface === 'attachmentURL') {
    normalized.target = normalized.target || 'attachments';
    normalized.targetKey = normalized.targetKey || 'id';
  }
  if (normalized.interface === 'chinaRegion') {
    normalized.target = normalized.target || 'chinaRegions';
    normalized.targetKey = normalized.targetKey || 'code';
    normalized.sourceKey = normalized.sourceKey || 'id';
    normalized.sortBy = normalized.sortBy || 'level';
    normalized.through = normalized.through || `t_${normalized.name}_links`;
    normalized.foreignKey = normalized.foreignKey || 'f_record_id';
    normalized.otherKey = normalized.otherKey || 'f_region_code';
  }
  if (normalized.interface === 'snowflakeId') {
    normalized.primaryKey = normalized.primaryKey ?? isPrimaryKeyLikeField(normalized);
    normalized.allowNull = normalized.allowNull ?? false;
    normalized.autoIncrement = normalized.autoIncrement ?? false;
  }
  if (normalized.interface === 'id') {
    normalized.primaryKey = normalized.primaryKey ?? isPrimaryKeyLikeField(normalized);
    normalized.allowNull = normalized.allowNull ?? false;
    normalized.autoIncrement = normalized.autoIncrement ?? true;
  }
  if (normalized.interface === 'uuid' || normalized.interface === 'nanoid') {
    normalized.primaryKey = normalized.primaryKey ?? isPrimaryKeyLikeField(normalized);
    normalized.allowNull = normalized.allowNull ?? false;
  }

  const reverseField = buildReverseField(normalized);
  if (reverseField) {
    normalized.reverseField = reverseField;
  }

  delete normalized.title;
  delete normalized.reverseName;
  delete normalized.reverseTitle;
  delete normalized.reverseInterface;
  delete normalized.targetTitleField;
  delete normalized.sourceTitleField;
  delete normalized.titleField;

  return normalized;
}

export function normalizeFieldList(fields: PlainObject[] = [], collectionName?: string) {
  return uniqueByName(fields.map((field) => normalizeFieldInput(field, { collectionName })));
}
