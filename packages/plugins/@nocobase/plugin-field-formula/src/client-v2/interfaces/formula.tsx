/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, createTypedFilterable, resolveFilterOperators } from '@nocobase/client-v2';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import { FormulaExpressionConfigureField } from '../components/FormulaExpressionConfigureField';
import { tExpr } from '../locale';

type FormulaFilterMeta = {
  options?: {
    dataType?: string;
  };
  dataType?: string;
  type?: string;
  uiSchema?: {
    type?: string;
  };
};

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

const resolveFormulaDataType = (meta?: FormulaFilterMeta) => {
  return meta?.options?.dataType || meta?.dataType || meta?.type || meta?.uiSchema?.type || 'double';
};

export const formulaDateOperators = resolveFilterOperators('datetime').filter(
  (operator) => !['$dateNotBefore', '$dateNotAfter'].includes(operator.value),
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
  configure = {
    components: {
      FormulaExpression: FormulaExpressionConfigureField,
    },
    properties: {
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
    },
  };
  filterable = createTypedFilterable(
    [
      { types: ['boolean'], operators: 'boolean' },
      { types: ['string'], operators: 'string' },
      { types: ['date'], operators: 'formulaDate' },
      { types: ['integer', 'double', 'bigInt', 'number'], operators: 'number' },
    ],
    resolveFormulaDataType,
  );
  titleUsable = true;
}
