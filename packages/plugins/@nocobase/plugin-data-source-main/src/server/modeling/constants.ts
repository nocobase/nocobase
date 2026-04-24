/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

export type PlainObject = Record<string, any>;
export type TemplateName = 'general' | 'tree' | 'file' | 'calendar' | 'sql' | 'view' | 'inherit';

export const TEMPLATE_NAMES: TemplateName[] = ['general', 'tree', 'file', 'calendar', 'sql', 'view', 'inherit'];

export const MULTI_COMPONENT_INTERFACES = new Set([
  'multipleSelect',
  'checkboxGroup',
  'm2m',
  'o2m',
  'attachment',
  'mbm',
]);

export const ARRAY_DEFAULT_INTERFACES = new Set(['multipleSelect', 'checkboxGroup']);
export const CHOICE_INTERFACES = new Set(['select', 'multipleSelect', 'radioGroup', 'checkboxGroup']);
export const RELATION_INTERFACES = new Set(['m2o', 'o2m', 'm2m', 'obo', 'oho', 'mbm']);

export const INTERFACE_ALIASES: Record<string, string> = {
  text: 'textarea',
  longText: 'textarea',
  singleSelect: 'select',
  multiSelect: 'multipleSelect',
  singleLineText: 'input',
  date: 'dateOnly',
  dateOnly: 'dateOnly',
  datetimeWithoutTz: 'datetimeNoTz',
  datetimeWithoutTimezone: 'datetimeNoTz',
  datetimeWithTimezone: 'datetime',
  unixTs: 'unixTimestamp',
  o2o: 'obo',
};

export const CHOICE_COLOR_OPTIONS = [
  'red',
  'magenta',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'default',
];

const CHOICE_COLOR_OPTION_SET = new Set(CHOICE_COLOR_OPTIONS);

export const PLUGIN_REQUIREMENTS: Record<string, { runtimeName: string; packageName: string; capability: string }> = {
  file: {
    runtimeName: 'file-manager',
    packageName: '@nocobase/plugin-file-manager',
    capability: 'file collection template',
  },
  attachment: {
    runtimeName: 'file-manager',
    packageName: '@nocobase/plugin-file-manager',
    capability: 'attachment field and attachments collection',
  },
  attachmentURL: {
    runtimeName: 'field-attachment-url',
    packageName: '@nocobase/plugin-field-attachment-url',
    capability: 'attachmentURL field',
  },
  vditor: {
    runtimeName: 'field-markdown-vditor',
    packageName: '@nocobase/plugin-field-markdown-vditor',
    capability: 'vditor field',
  },
  point: {
    runtimeName: 'map',
    packageName: '@nocobase/plugin-map',
    capability: 'point geometry field',
  },
  lineString: {
    runtimeName: 'map',
    packageName: '@nocobase/plugin-map',
    capability: 'lineString geometry field',
  },
  circle: {
    runtimeName: 'map',
    packageName: '@nocobase/plugin-map',
    capability: 'circle geometry field',
  },
  polygon: {
    runtimeName: 'map',
    packageName: '@nocobase/plugin-map',
    capability: 'polygon geometry field',
  },
  chinaRegion: {
    runtimeName: 'field-china-region',
    packageName: '@nocobase/plugin-field-china-region',
    capability: 'chinaRegion field and chinaRegions backing collection',
  },
  formula: {
    runtimeName: 'field-formula',
    packageName: '@nocobase/plugin-field-formula',
    capability: 'formula field',
  },
  sort: {
    runtimeName: 'field-sort',
    packageName: '@nocobase/plugin-field-sort',
    capability: 'sort field',
  },
  code: {
    runtimeName: 'field-code',
    packageName: '@nocobase/plugin-field-code',
    capability: 'code field',
  },
  sequence: {
    runtimeName: 'field-sequence',
    packageName: '@nocobase/plugin-field-sequence',
    capability: 'sequence field',
  },
  encryption: {
    runtimeName: 'field-encryption',
    packageName: '@nocobase/plugin-field-encryption',
    capability: 'encryption field',
  },
  mbm: {
    runtimeName: 'field-m2m-array',
    packageName: '@nocobase/plugin-field-m2m-array',
    capability: 'many-to-many array field',
  },
};

export function toDisplayTitle(value?: string) {
  if (!value) {
    return value;
  }
  return _.startCase(value.replace(/[._-]+/g, ' '));
}

export function normalizeChoiceEnum(enumValues: any[] = []) {
  return enumValues.map((item) => {
    if (_.isPlainObject(item)) {
      return item;
    }
    return {
      label: String(item),
      value: item,
    };
  });
}

export function validateChoiceEnumColors(enumValues: any[] = [], fieldName = '(unknown)') {
  const allowedColors = CHOICE_COLOR_OPTIONS.join(', ');

  enumValues.forEach((item, index) => {
    if (!_.isPlainObject(item)) {
      throw new Error(
        `Field ${fieldName} enum item #${
          index + 1
        } must be an object with value, label, and color; string shorthand is not allowed`,
      );
    }

    const optionName = item.value ?? item.label ?? `#${index + 1}`;

    if (!item.color) {
      throw new Error(`Field ${fieldName} enum item ${optionName} requires color`);
    }

    if (!CHOICE_COLOR_OPTION_SET.has(item.color)) {
      throw new Error(
        `Field ${fieldName} enum item ${optionName} color ${item.color} is invalid. Allowed colors: ${allowedColors}`,
      );
    }
  });
}

export function uniqueByName(fields: PlainObject[]) {
  return _.uniqBy(fields.filter(Boolean).reverse(), 'name').reverse();
}
