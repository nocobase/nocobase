/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const FIELDS_VALIDATION_OPTIONS = {
  string: [
    {
      key: 'required',
      label: 'Required',
      hasValue: false,
      params: [],
    },
    {
      key: 'max',
      label: 'Max',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'min',
      label: 'Min',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'case',
      label: 'Case',
      hasValue: true,
      params: [
        {
          key: 'direction',
          label: 'Direction',
          componentType: 'radio',
          options: [
            { label: 'Uppercase', value: 'upper' },
            { label: 'Lowercase', value: 'lower' },
          ],
        },
      ],
    },
    {
      key: 'pattern',
      label: 'Pattern',
      hasValue: true,
      params: [{ key: 'regex', label: 'Regular Expression', componentType: 'text' }],
    },
    {
      key: 'email',
      label: 'Email',
      hasValue: true,
      params: [
        {
          key: 'allowFullyQualified',
          label: 'Allow Fully Qualified',
          componentType: 'checkbox',
        },
        {
          key: 'allowUnicode',
          label: 'Allow Unicode',
          componentType: 'checkbox',
        },
        {
          key: 'ignoreLength',
          label: 'Ignore Length',
          componentType: 'checkbox',
        },
        {
          key: 'minDomainSegments',
          label: 'Min Domain Segments',
          componentType: 'inputNumber',
          defaultValue: 2,
        },
        {
          key: 'maxDomainSegments',
          label: 'Max Domain Segments',
          componentType: 'inputNumber',
        },
        {
          key: 'tlds',
          label: 'TLDs',
          componentType: 'singleSelect',
          options: [
            {
              label: 'Allow true',
              value: 'AllowTrue',
            },
            {
              label: 'Allow false',
              value: 'AllowFalse',
            },
            {
              label: 'Allow custom',
              value: 'AllowCustom',
              componentType: 'text',
            },
            {
              label: 'Deny custom',
              value: 'DenyCustom',
              componentType: 'text',
            },
          ],
        },
      ],
      paramsType: 'object',
    },
    {
      key: 'uuid',
      label: 'UUID',
      hasValue: true,
      params: [
        {
          key: 'version',
          label: 'Version',
          componentType: 'multipleSelect',
          options: [
            { label: 'uuidv1', value: 'uuidv1' },
            { label: 'uuidv2', value: 'uuidv2' },
            { label: 'uuidv3', value: 'uuidv3' },
            { label: 'uuidv4', value: 'uuidv4' },
            { label: 'uuidv5', value: 'uuidv5' },
            { label: 'uuidv6', value: 'uuidv6' },
            { label: 'uuidv7', value: 'uuidv7' },
            { label: 'uuidv8', value: 'uuidv8' },
          ],
        },
        {
          key: 'separator',
          label: 'Separator',
          componentType: 'singleSelect',
          options: [
            { label: 'Must use `-` and `:`', value: true },
            { label: 'No allow `-` and `:`', value: false },
            { label: 'Only use `-`', value: '-' },
            { label: 'Only use `_`', value: '_' },
            { label: 'Only use `.`', value: '.' },
          ],
        },
      ],
      paramsType: 'object',
    },
    {
      key: 'hex',
      label: 'Hex',
      hasValue: true,
      params: [
        {
          key: 'prefix',
          label: 'Prefix',
          componentType: 'singleSelect',
          options: [
            { label: 'Must use prefix', value: true },
            { label: 'No use prefix', value: false },
            { label: 'Optional prefix', value: 'optional' },
          ],
        },
        {
          key: 'byteAligned',
          label: 'Byte Aligned',
          componentType: 'checkbox',
        },
      ],
    },
    {
      key: 'length',
      label: 'Length',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'uri',
      label: 'URI',
      hasValue: true,
      params: [
        {
          key: 'scheme',
          label: 'Scheme',
          componentType: 'multipleSelect',
          options: [
            { label: 'http', value: 'http' },
            { label: 'https', value: 'https' },
            { label: 'ftp', value: 'ftp' },
            { label: 'file', value: 'file' },
            { label: 'ws', value: 'ws' },
            { label: 'wss', value: 'wss' },
          ],
        },
        {
          key: 'allowRelative',
          label: 'Allow Relative',
          componentType: 'checkbox',
        },
        {
          key: 'relativeOnly',
          label: 'Relative Only',
          componentType: 'checkbox',
        },
        {
          key: 'allowQuerySquareBrackets',
          label: 'Allow Query Square Brackets',
          componentType: 'checkbox',
        },
        {
          key: 'encodeUri',
          label: 'Encode URI',
          componentType: 'checkbox',
        },
      ],
      paramsType: 'object',
    },
  ],
  number: [
    {
      key: 'required',
      label: 'Required',
      hasValue: false,
      params: [],
    },
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'max',
      label: 'Max',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'min',
      label: 'Min',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'multiple',
      label: 'Multiple',
      hasValue: true,
      params: [{ key: 'base', label: 'Base', componentType: 'inputNumber' }],
    },
    { key: 'integer', label: 'Integer', hasValue: false, params: [] },
    {
      key: 'precision',
      label: 'Precision',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber' }],
    },
    {
      key: 'unsafe',
      label: 'Unsafe integer',
      hasValue: false,
      params: [],
    },
  ],
  date: [
    {
      key: 'required',
      label: 'Required',
      hasValue: false,
      params: [],
    },
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker' }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker' }],
    },
    {
      key: 'max',
      label: 'Max',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker' }],
    },
    {
      key: 'min',
      label: 'Min',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker' }],
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      hasValue: true,
      params: [
        {
          key: 'type',
          label: 'Type',
          componentType: 'singleSelect',
          options: [
            { label: 'JavaScript', value: 'javascript' },
            { label: 'Unix', value: 'unix' },
          ],
          defaultValue: 'javascript',
        },
      ],
    },
  ],
} as const;

export type ValidationKeysByType = {
  [K in keyof typeof FIELDS_VALIDATION_OPTIONS]: (typeof FIELDS_VALIDATION_OPTIONS)[K][number]['key'];
};

export type ValidationType = keyof typeof FIELDS_VALIDATION_OPTIONS;

export type AvailableValidationOption<T extends ValidationType = ValidationType> = ValidationKeysByType[T];
