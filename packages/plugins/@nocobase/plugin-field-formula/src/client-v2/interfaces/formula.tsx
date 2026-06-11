/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionFieldInterface,
  createTypedFilterable,
  dateTimeFormatConfigureItems,
  type FieldConfigureEffectContext,
  type FieldInterfaceConfigure,
  resolveFilterOperators,
} from '@nocobase/client-v2';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { Registry } from '@nocobase/utils/client';
import type { ReactNode } from 'react';
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

const resolveFormulaDataType = (meta?: FormulaFilterMeta) => {
  return meta?.options?.dataType || meta?.dataType || meta?.type || meta?.uiSchema?.type || 'double';
};

export const formulaDateOperators = resolveFilterOperators('datetime').filter(
  (operator) => !['$dateNotBefore', '$dateNotAfter'].includes(operator.value),
);

const isDateFormula = ({ getValue }: FieldConfigureEffectContext) => getValue('dataType') === 'date';
const isNumberFormula = ({ getValue }: FieldConfigureEffectContext) =>
  ['double', 'decimal'].includes(String(getValue('dataType')));

function getEvaluatorOptions() {
  return Array.from((evaluators as Registry<Evaluator>).getEntities()).reduce<
    Array<{ label: ReactNode; value: string }>
  >((result, [value, options]) => result.concat({ value: String(value), label: options.label }), []);
}

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
  configure: FieldInterfaceConfigure = {
    items: [
      {
        name: 'dataType',
        title: '{{t("Storage type")}}',
        component: 'Select',
        disabled: ({ context }) => !context.createOnly,
        options: [
          { value: 'boolean', label: 'Boolean' },
          { value: 'integer', label: 'Integer' },
          { value: 'bigInt', label: 'Big integer' },
          { value: 'double', label: 'Double' },
          { value: 'string', label: 'String' },
          { value: 'date', label: 'Datetime' },
        ],
        required: true,
        defaultValue: 'double',
      },
      {
        name: 'uiSchema.x-component-props.step',
        title: '{{t("Precision")}}',
        component: 'Select',
        required: true,
        defaultValue: '0',
        options: [
          { value: '0', label: '1' },
          { value: '0.1', label: '1.0' },
          { value: '0.01', label: '1.00' },
          { value: '0.001', label: '1.000' },
          { value: '0.0001', label: '1.0000' },
          { value: '0.00001', label: '1.00000' },
        ],
        hidden: (context) => !isNumberFormula(context),
      },
      ...dateTimeFormatConfigureItems({
        includePicker: false,
        showTimeDefault: true,
        hidden: (context) => !isDateFormula(context),
      }),
      {
        name: 'engine',
        title: tExpr('Calculation engine'),
        component: 'Radio.Group',
        options: getEvaluatorOptions(),
        required: true,
        defaultValue: 'formula.js',
      },
      {
        name: 'expression',
        title: tExpr('Expression'),
        required: true,
        Component: FormulaExpressionConfigureField,
        componentProps: {
          useCurrentFields: '{{ useCurrentFields }}',
        },
        description: tExpr('Syntax references'),
      },
    ],
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
