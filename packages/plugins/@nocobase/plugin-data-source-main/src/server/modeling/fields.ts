/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { Utils } from 'sequelize';
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
  validateChoiceEnumColors,
} from './constants';

export function normalizeInterfaceName(value?: string) {
  if (!value) {
    return value;
  }
  return INTERFACE_ALIASES[value] || value;
}

const DEFAULT_FIELD_TYPES: Record<string, string> = {
  input: 'string',
  phone: 'string',
  email: 'string',
  color: 'string',
  icon: 'string',
  url: 'text',
  textarea: 'text',
  markdown: 'text',
  vditor: 'text',
  richText: 'text',
  integer: 'bigInt',
  number: 'double',
  percent: 'float',
  password: 'password',
  checkbox: 'boolean',
  select: 'string',
  radioGroup: 'string',
  multipleSelect: 'array',
  checkboxGroup: 'array',
  json: 'json',
  attachment: 'belongsToMany',
  attachmentURL: 'string',
  point: 'point',
  lineString: 'lineString',
  circle: 'circle',
  polygon: 'polygon',
  datetime: 'date',
  createdAt: 'date',
  updatedAt: 'date',
  datetimeNoTz: 'datetimeNoTz',
  dateOnly: 'dateOnly',
  time: 'time',
  unixTimestamp: 'unixTimestamp',
  m2o: 'belongsTo',
  obo: 'belongsTo',
  createdBy: 'belongsTo',
  updatedBy: 'belongsTo',
  o2m: 'hasMany',
  m2m: 'belongsToMany',
  oho: 'hasOne',
  chinaRegion: 'belongsToMany',
  snowflakeId: 'snowflakeId',
  id: 'bigInt',
  uuid: 'uuid',
  nanoid: 'nanoid',
  formula: 'formula',
  sort: 'sort',
  code: 'code',
  sequence: 'sequence',
  encryption: 'string',
  tableoid: 'virtual',
  mbm: 'belongsToArray',
};

const ALLOWED_FIELD_TYPES: Record<string, string[]> = {
  input: ['string'],
  phone: ['string'],
  email: ['string'],
  color: ['string'],
  icon: ['string'],
  url: ['text', 'string'],
  textarea: ['text', 'string'],
  markdown: ['text', 'string'],
  vditor: ['text', 'string'],
  richText: ['text', 'string'],
  integer: ['bigInt', 'integer'],
  number: ['double', 'float', 'decimal', 'integer', 'bigInt'],
  percent: ['float', 'double', 'decimal'],
  password: ['password', 'string'],
  checkbox: ['boolean'],
  select: ['string'],
  radioGroup: ['string'],
  multipleSelect: ['array'],
  checkboxGroup: ['array'],
  json: ['json', 'jsonb'],
  attachment: ['belongsToMany'],
  attachmentURL: ['string'],
  point: ['point', 'json'],
  lineString: ['lineString', 'json'],
  circle: ['circle', 'json'],
  polygon: ['polygon', 'json'],
  datetime: ['date'],
  createdAt: ['date'],
  updatedAt: ['date'],
  datetimeNoTz: ['datetimeNoTz'],
  dateOnly: ['dateOnly'],
  time: ['time'],
  unixTimestamp: ['unixTimestamp'],
  m2o: ['belongsTo'],
  obo: ['belongsTo'],
  createdBy: ['belongsTo'],
  updatedBy: ['belongsTo'],
  o2m: ['hasMany'],
  m2m: ['belongsToMany'],
  oho: ['hasOne'],
  chinaRegion: ['belongsToMany'],
  snowflakeId: ['snowflakeId'],
  id: ['bigInt'],
  uuid: ['uuid'],
  nanoid: ['nanoid'],
  formula: ['formula'],
  sort: ['sort'],
  code: ['code'],
  sequence: ['sequence'],
  encryption: ['encryption', 'string'],
  tableoid: ['virtual'],
  mbm: ['belongsToArray'],
};

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
  const defaultType = DEFAULT_FIELD_TYPES[field.interface];
  if (!defaultType) {
    throw new Error(`Unknown field interface ${field.interface}`);
  }

  return field.type || defaultType;
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
    case 'vditor':
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
    case 'point':
    case 'lineString':
    case 'circle':
    case 'polygon':
      return {
        type: 'void',
        title,
        'x-component': 'Map',
        'x-component-designer': 'Map.Designer',
        'x-component-props': {},
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
      return { type: 'number', title, 'x-component': 'InputNumber', 'x-read-pretty': true };
    case 'uuid':
      return { type: 'string', title, 'x-component': 'Input', 'x-validator': 'uuid' };
    case 'nanoid':
      return { type: 'string', title, 'x-component': 'NanoIDInput' };
    case 'formula':
      return {
        type: 'string',
        title,
        'x-component': 'Formula.Result',
        'x-component-props': { stringMode: true, step: '1' },
        'x-read-pretty': true,
      };
    case 'sort':
      return { type: 'number', title, 'x-component': 'InputNumber' };
    case 'code':
      return { type: 'string', title, 'x-component': 'CodeEditor' };
    case 'sequence':
      return { type: 'string', title, 'x-component': 'Sequence' };
    case 'tableoid':
      return {
        type: 'string',
        title,
        'x-component': 'CollectionSelect',
        'x-component-props': {
          isTableOid: true,
        },
        'x-read-pretty': true,
      };
    default:
      return { type: 'string', title, 'x-component': 'Input' };
  }
}

function validateFieldType(field: PlainObject) {
  const allowedTypes = ALLOWED_FIELD_TYPES[field.interface];
  if (!allowedTypes) {
    throw new Error(`Unknown field interface ${field.interface}`);
  }
  if (field.type && !allowedTypes.includes(field.type)) {
    throw new Error(
      `Field ${field.name || '(unknown)'} type ${field.type} does not match interface ${
        field.interface
      }. Allowed types: ${allowedTypes.join(', ')}`,
    );
  }
}

function buildRelationKeyName(name?: string, key = 'id') {
  return Utils.camelize([Utils.singularize(name || ''), key].join('_'));
}

const REVERSE_INTERFACE_MAP: Partial<Record<string, string>> = {
  m2o: 'o2m',
  o2m: 'm2o',
  m2m: 'm2m',
  obo: 'oho',
  oho: 'obo',
};

function buildThroughName(source?: string, target?: string) {
  return Utils.camelize(
    [source, target]
      .filter(Boolean)
      .map((name) => String(name).toLowerCase())
      .sort()
      .join('_'),
  );
}

function applyReadableRelationDefaults(field: PlainObject) {
  const sourceKey = field.sourceKey || 'id';
  const targetKey = field.targetKey || 'id';

  if (field.interface === 'm2o' || field.interface === 'obo') {
    field.targetKey = field.targetKey || targetKey;
    field.foreignKey = field.foreignKey || buildRelationKeyName(field.name, field.targetKey);
    return;
  }

  if (field.interface === 'o2m' || field.interface === 'oho') {
    field.sourceKey = field.sourceKey || sourceKey;
    field.foreignKey = field.foreignKey || buildRelationKeyName(field.collectionName, field.sourceKey);
    return;
  }

  if (field.interface === 'm2m' || field.interface === 'mbm') {
    field.sourceKey = field.sourceKey || sourceKey;
    field.targetKey = field.targetKey || targetKey;
    field.foreignKey = field.foreignKey || buildRelationKeyName(field.collectionName, field.sourceKey);
    field.otherKey = field.otherKey || buildRelationKeyName(field.target, field.targetKey);
    field.through = field.through || buildThroughName(field.collectionName, field.target);
  }
}

function buildReverseField(field: PlainObject) {
  if (field.reverseField) {
    return normalizeFieldInput(field.reverseField, { collectionName: field.target });
  }
  if (!field.reverseName) {
    return undefined;
  }

  const reverseInterface = field.reverseInterface || REVERSE_INTERFACE_MAP[field.interface];

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

function getChoiceEnumInput(field: PlainObject) {
  if (Array.isArray(field?.enum)) {
    return field.enum;
  }

  if (Array.isArray(field?.uiSchema?.enum)) {
    return field.uiSchema.enum;
  }

  return [];
}

export function validateChoiceFieldInput(field: PlainObject = {}) {
  const interfaceName = normalizeInterfaceName(field.interface);

  if (!CHOICE_INTERFACES.has(interfaceName)) {
    return;
  }

  const enumValues = getChoiceEnumInput(field);
  if (!enumValues.length) {
    return;
  }

  validateChoiceEnumColors(enumValues, field.name || '(unknown)');
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

  validateFieldType(field);

  if (RELATION_INTERFACES.has(field.interface) && !field.target) {
    throw new Error(`Relation field ${field.name} requires target`);
  }
  if (field.interface === 'formula' && !field.expression) {
    throw new Error(`Formula field ${field.name || '(unknown)'} requires expression`);
  }

  applyReadableRelationDefaults(field);

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
  if (normalized.interface === 'tableoid') {
    normalized.name = normalized.name || '__collection';
  }
  if (normalized.interface === 'formula') {
    normalized.engine = normalized.engine || 'formula.js';
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
