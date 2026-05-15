/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { CollectionFieldInterface } from '@nocobase/client-v2';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import { tExpr } from '../locale';

const numberReactions = [
  {
    dependencies: ['dataType'],
    fulfill: {
      state: {
        display: '{{["double", "decimal"].includes($deps[0]) ? "visible" : "none"}}',
      },
    },
  },
];

const datetimeReactions = [
  {
    dependencies: ['dataType'],
    fulfill: {
      state: {
        display: '{{$deps[0] === "date" ? "visible" : "none"}}',
      },
    },
  },
];

const resolveFormulaDataType = (meta?: any) => {
  return meta?.options?.dataType || meta?.dataType || meta?.type || meta?.uiSchema?.type || 'double';
};

const operators = {
  boolean: [
    {
      label: '{{t("Yes")}}',
      value: '$isTruly',
      selected: true,
      noValue: true,
      schema: {
        'x-component': 'Select',
        'x-component-props': {
          multiple: false,
          options: [
            { label: '{{t("Yes")}}', value: true },
            { label: '{{t("No")}}', value: false },
          ],
        },
      },
    },
    {
      label: '{{t("No")}}',
      value: '$isFalsy',
      noValue: true,
      schema: {
        'x-component': 'Select',
        'x-component-props': {
          multiple: false,
          options: [
            { label: '{{t("Yes")}}', value: true },
            { label: '{{t("No")}}', value: false },
          ],
        },
      },
    },
    { label: "{{ t('is empty') }}", value: '$empty', noValue: true },
    { label: "{{ t('is not empty') }}", value: '$notEmpty', noValue: true },
  ],
  string: [
    { label: '{{t("contains")}}', value: '$includes', selected: true },
    { label: '{{t("does not contain")}}', value: '$notIncludes' },
    { label: '{{t("is")}}', value: '$eq' },
    { label: '{{t("is not")}}', value: '$ne' },
    { label: '{{t("is empty")}}', value: '$empty', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
  ],
  datetime: [
    {
      label: "{{ t('is') }}",
      value: '$dateOn',
      selected: true,
      schema: {
        'x-component': 'DateFilterDynamicComponent',
        'x-component-props': { isRange: false },
      },
      onlyFilterAction: true,
    },
    {
      label: "{{ t('is not') }}",
      value: '$dateNotOn',
      schema: {
        'x-component': 'DateFilterDynamicComponent',
        'x-component-props': { isRange: false },
      },
      onlyFilterAction: true,
    },
    {
      label: "{{ t('is before') }}",
      value: '$dateBefore',
      schema: {
        'x-component': 'DateFilterDynamicComponent',
        'x-component-props': { isRange: false },
      },
      onlyFilterAction: true,
    },
    {
      label: "{{ t('is after') }}",
      value: '$dateAfter',
      schema: {
        'x-component': 'DateFilterDynamicComponent',
        'x-component-props': { isRange: false },
      },
      onlyFilterAction: true,
    },
    {
      label: "{{ t('is between') }}",
      value: '$dateBetween',
      schema: {
        'x-component': 'DateFilterDynamicComponent',
        'x-component-props': { isRange: true },
      },
    },
    { label: "{{ t('is empty') }}", value: '$empty', noValue: true },
    { label: "{{ t('is not empty') }}", value: '$notEmpty', noValue: true },
  ],
  number: [
    { label: '{{t("=")}}', value: '$eq', selected: true },
    { label: '{{t("≠")}}', value: '$ne' },
    { label: '{{t(">")}}', value: '$gt' },
    { label: '{{t("≥")}}', value: '$gte' },
    { label: '{{t("<")}}', value: '$lt' },
    { label: '{{t("≤")}}', value: '$lte' },
    { label: '{{t("is empty")}}', value: '$empty', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notEmpty', noValue: true },
  ],
};

const formulaOperatorGroups = [
  { types: ['boolean'], operators: operators.boolean },
  { types: ['string'], operators: operators.string },
  { types: ['date'], operators: operators.datetime },
  { types: ['integer', 'double', 'bigInt', 'number'], operators: operators.number },
];

const formulaFilterOperators = formulaOperatorGroups.flatMap(({ types, operators: operatorList }) =>
  operatorList.map((operator) => ({
    ...operator,
    visible: (meta: any) => {
      const matches = types.includes(resolveFormulaDataType(meta));
      if (typeof (operator as any).visible === 'function') {
        return (operator as any).visible(meta) && matches;
      }
      return matches;
    },
  })),
);

const dateTimeProperties = {
  'uiSchema.x-component-props.dateFormat': {
    type: 'string',
    title: '{{t("Date format")}}',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
      { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
      { label: 'MM/DD/YY', value: 'MM/DD/YY' },
      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
      { label: '{{t("Custom")}}', value: 'custom' },
    ],
    default: 'YYYY-MM-DD',
    'x-reactions': datetimeReactions,
  },
  'uiSchema.x-component-props.showTime': {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-content': '{{t("Show time")}}',
    default: true,
    'x-reactions': datetimeReactions,
  },
  'uiSchema.x-component-props.timeFormat': {
    type: 'string',
    title: '{{t("Time format")}}',
    'x-component': 'Radio.Group',
    'x-decorator': 'FormItem',
    default: 'HH:mm:ss',
    enum: [
      { label: '{{t("12 hour")}}', value: 'hh:mm:ss a' },
      { label: '{{t("24 hour")}}', value: 'HH:mm:ss' },
    ],
    'x-reactions': [
      ...datetimeReactions,
      {
        dependencies: ['uiSchema.x-component-props.showTime'],
        fulfill: { state: { hidden: '{{ !$deps[0] }}' } },
      },
    ],
  },
};

export class FormulaFieldInterface extends CollectionFieldInterface {
  name = 'formula';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = tExpr('Formula');
  description = tExpr(
    'Configure and store the results of calculations between multiple field values in the same record, supporting both Math.js and Excel formula functions.',
  );
  sortable = true;
  default = {
    interface: 'formula',
    type: 'formula',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
      'x-read-pretty': true,
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  };
  properties = {
    dataType: {
      type: 'string',
      title: '{{t("Storage type")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      enum: [
        { value: 'boolean', label: 'Boolean' },
        { value: 'integer', label: 'Integer' },
        { value: 'bigInt', label: 'Big integer' },
        { value: 'double', label: 'Double' },
        { value: 'string', label: 'String' },
        { value: 'date', label: 'Datetime' },
      ],
      required: true,
      default: 'double',
    },
    'uiSchema.x-component-props.step': {
      type: 'string',
      title: '{{t("Precision")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      required: true,
      default: '0',
      enum: [
        { value: '0', label: '1' },
        { value: '0.1', label: '1.0' },
        { value: '0.01', label: '1.00' },
        { value: '0.001', label: '1.000' },
        { value: '0.0001', label: '1.0000' },
        { value: '0.00001', label: '1.00000' },
      ],
      'x-reactions': numberReactions,
    },
    ...dateTimeProperties,
    engine: {
      type: 'string',
      title: tExpr('Calculation engine'),
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: Array.from((evaluators as Registry<Evaluator>).getEntities()).reduce(
        (result: any[], [value, options]) => result.concat({ value, ...options }),
        [],
      ),
      required: true,
      default: 'formula.js',
    },
    expression: {
      type: 'string',
      title: tExpr('Expression'),
      required: true,
      'x-component': 'FormulaExpression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        useCurrentFields: '{{ useCurrentFields }}',
      },
      'x-reactions': {
        dependencies: ['engine'],
        fulfill: {
          schema: {
            description: '{{ $deps[0] ? t("Syntax references") : "" }}',
          },
        },
      },
    },
  };
  filterable = {
    operators: formulaFilterOperators,
  };
  titleUsable = true;

  schemaInitialize(schema: ISchema, { block }: any) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props'].ellipsis = true;
      schema['x-component-props'].size = 'small';
    }
  }
}
