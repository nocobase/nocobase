/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
export const REQUIRED_RULE_KEY = 'required';
export const DEFAULT_VALIDATION_RULES = [
  {
    key: REQUIRED_RULE_KEY,
    label: 'Required',
    hasValue: false,
    params: [],
  },
];

export const FIELDS_VALIDATION_OPTIONS = {
  string: [
    ...DEFAULT_VALIDATION_RULES,
    {
      key: 'max',
      label: 'Max value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'min',
      label: 'Min value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'pattern',
      label: 'Pattern',
      hasValue: true,
      params: [{ key: 'regex', label: 'Regular Expression', componentType: 'text', required: true }],
    },
    {
      key: 'email',
      label: 'Email',
      hasValue: true,
      params: [
        {
          key: 'allowFullyQualified',
          label: 'Domains ending with a . character are permitted',
          componentType: 'checkbox',
        },
        {
          key: 'allowUnicode',
          label: 'Unicode characters are permitted',
          componentType: 'checkbox',
        },
        {
          key: 'ignoreLength',
          label: 'Ignore invalid email length errors',
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
          label: 'tlds',
          componentType: 'radio',
          defaultValue: 'iana',
          options: [
            {
              label: 'IANA registry',
              value: 'iana',
            },
            {
              label: 'Disable validation',
              value: 'disable',
            },
            {
              label: 'Allow list',
              value: 'allow',
              componentType: 'text',
            },
            {
              label: 'Deny list',
              value: 'deny',
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
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
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
          label: 'Allow relative URIs',
          componentType: 'checkbox',
        },
        {
          key: 'relativeOnly',
          label: 'Restrict only relative URIs',
          componentType: 'checkbox',
        },
        {
          key: 'allowQuerySquareBrackets',
          label: 'Allows unencoded square brackets inside the query string',
          componentType: 'checkbox',
        },
        {
          key: 'encodeUri',
          label: 'Attempts to encode the URI using encodeURI before validating it again',
          componentType: 'checkbox',
        },
      ],
      paramsType: 'object',
    },
  ],
  number: [
    ...DEFAULT_VALIDATION_RULES,
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'max',
      label: 'Max value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'min',
      label: 'Min value',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'multiple',
      label: 'Multiple',
      hasValue: true,
      params: [{ key: 'base', label: 'Base', componentType: 'inputNumber', required: true }],
    },
    { key: 'integer', label: 'Integer', hasValue: false, params: [] },
    {
      key: 'precision',
      label: 'Precision',
      hasValue: true,
      params: [{ key: 'limit', label: 'Limit', componentType: 'inputNumber', required: true }],
    },
    {
      key: 'unsafe',
      label: 'Unsafe integer',
      hasValue: false,
      params: [],
    },
  ],
  date: [
    ...DEFAULT_VALIDATION_RULES,
    {
      key: 'greater',
      label: 'Greater than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'less',
      label: 'Less than',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'max',
      label: 'Max',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
    },
    {
      key: 'min',
      label: 'Min',
      hasValue: true,
      params: [{ key: 'date', label: 'Date', componentType: 'datePicker', required: true }],
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
  object: [...DEFAULT_VALIDATION_RULES],
} as const;

export type ValidationKeysByType = {
  [K in keyof typeof FIELDS_VALIDATION_OPTIONS]: (typeof FIELDS_VALIDATION_OPTIONS)[K][number]['key'];
};

export type ValidationType = keyof typeof FIELDS_VALIDATION_OPTIONS;

export type AvailableValidationOption<T extends ValidationType = ValidationType> = ValidationKeysByType[T];
