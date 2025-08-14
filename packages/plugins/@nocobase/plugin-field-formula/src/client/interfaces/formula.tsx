/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, i18n, interfacesProperties } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { lodash, Registry } from '@nocobase/utils/client';
import { NAMESPACE } from '../locale';

// const booleanReactions = [
//   {
//     dependencies: ['dataType'],
//     fulfill: {
//       state: {
//         display: '{{$deps[0] === "boolean" ? "visible" : "none"}}',
//       },
//     },
//   }
// ];

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

const { defaultProps, dateTimeProps, operators } = interfacesProperties;
const datetimeProperties = {
  'uiSchema.x-component-props.dateFormat': {
    ...lodash.cloneDeep(dateTimeProps['uiSchema.x-component-props.dateFormat']),
    'x-reactions': datetimeReactions,
  },
  'uiSchema.x-component-props.showTime': {
    ...lodash.cloneDeep(dateTimeProps['uiSchema.x-component-props.showTime']),
    'x-reactions': [
      ...(dateTimeProps['uiSchema.x-component-props.showTime']['x-reactions'] as string[]),
      ...datetimeReactions,
    ],
  },
  'uiSchema.x-component-props.timeFormat': {
    ...lodash.cloneDeep(dateTimeProps['uiSchema.x-component-props.timeFormat']),
  },
};

export class FormulaFieldInterface extends CollectionFieldInterface {
  name = 'formula';
  type = 'object';
  group = 'advanced';
  order = 1;
  title = `{{t("Formula", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Configure and store the results of calculations between multiple field values in the same record, supporting both Math.js and Excel formula functions.", { ns: "${NAMESPACE}" })}}`;
  sortable = true;
  default = {
    type: 'formula',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Formula.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-read-pretty': true,
    },
  };
  properties = {
    ...defaultProps,
    dataType: {
      type: 'string',
      title: '{{t("Storage type")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      enum: [
        { value: 'boolean', label: 'Boolean' },
        { value: 'integer', label: 'Integer' },
        { value: 'bigInt', label: 'Big integer' }, // not fully supported as JS native bigint type
        { value: 'double', label: 'Double' },
        // { value: 'decimal', label: 'Decimal' }, // not supported
        { value: 'string', label: 'String' },
        { value: 'date', label: 'Datetime' },
      ],
      required: true,
      default: 'double',
    },
    // 'uiSchema.x-component-props.showUnchecked': {
    //   type: 'boolean',
    //   title: '{{t("Display X when unchecked")}}',
    //   default: false,
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    //   'x-reactions': booleanReactions
    // },
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
    ...datetimeProperties,
    engine: {
      type: 'string',
      title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
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
      title: `{{t("Expression", { ns: "${NAMESPACE}" })}}`,
      required: true,
      'x-component': 'Formula.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        useCurrentFields: '{{ useCurrentFields }}',
        // evaluate(exp: string) {
        //   const { values } = useForm();
        //   const { evaluate } = evaluators.get(values.engine);
        //   return evaluate(exp);
        // }
      },
      'x-reactions': {
        dependencies: ['engine'],
        fulfill: {
          schema: {
            description: '{{renderExpressionDescription($deps[0])}}',
          },
        },
      },
      // ['x-validator'](value, rules, { form }) {
      //   const { values } = form;
      //   const { evaluate } = (evaluators as Registry<Evaluator>).get(values.engine);
      //   const exp = value.trim().replace(/{{\s*([^{}]+)\s*}}/g, '1');
      //   try {
      //     evaluate(exp);
      //     return '';
      //   } catch (e) {
      //     return i18n.t('Expression syntax error', { ns: NAMESPACE });
      //   }
      // },
    },
  };
  filterable = {
    operators: operators.number,
  };
  titleUsable = true;
}
