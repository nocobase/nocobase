import { i18n, IField, interfacesProperties } from '@nocobase/client';
import { Evaluator, evaluators } from '@nocobase/evaluators/client';
import { lodash, Registry } from '@nocobase/utils/client';
import { NAMESPACE } from '../locale';

const ignoreDecimalsReactions = [
  {
    dependencies: ['currency'],
    fulfill: {
      state: {
        display: '{{$deps[0]  ? "visible" : "none"}}',
      },
    },
  },
];

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

export default {
  name: 'NumberToWords',
  type: 'object',
  group: 'advanced',
  order: 1,
  title: `{{t("NumberToWords", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("Compute a value based on the other fields", { ns: "${NAMESPACE}" })}}`,
  sortable: true,
  default: {
    type: 'numberToWords',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'NumberToWords.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-read-pretty': true,
    },
  },
  properties: {
    ...defaultProps,
    dataType: {
      type: 'string',
      title: '{{t("Storage type")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      enum: [{ value: 'string', label: 'String' }],
      required: true,
      default: 'string',
      'x-hidden': true,
    },
    currency: {
      type: 'string',
      title: '{{t("Currency")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-disabled': '{{ !createOnly }}',
      enum: [
        { value: null, label: 'Not A Currency' },
        { value: 'en-IN', label: 'India-English' },
        { value: 'en-US', label: 'USA-English' },
        { value: 'hi-IN', label: 'India-Hindi' },
      ],
      required: false,
      default: null,
    },
    'uiSchema.x-component-props.ignoreDecimal': {
      type: 'boolean',
      title: '{{t("Ignore Decimal")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
      required: false,
      default: true,
      'x-reactions': ignoreDecimalsReactions,
    },
    'uiSchema.x-component-props.doNotAddOnly': {
      type: 'boolean',
      title: '{{t("IDo Not Add Only")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
      required: false,
      default: true,
      'x-reactions': ignoreDecimalsReactions,
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
      default: 'math.js',
    },
    expression: {
      type: 'string',
      title: `{{t("Expression", { ns: "${NAMESPACE}" })}}`,
      required: true,
      'x-component': 'NumberToWords.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        supports: [
          'number',

          // 'json'
        ],
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
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = (evaluators as Registry<Evaluator>).get(values.engine);
        const exp = value.trim().replace(/{{\s*([^{}]+)\s*}}/g, '1');
        try {
          evaluate(exp);
          return '';
        } catch (e) {
          return i18n.t('Expression syntax error', { ns: NAMESPACE });
        }
      },
    },
  },
  filterable: {
    operators: operators.number,
  },
  titleUsable: true,
  'x-read-only': true,
  'x-read-pretty': true,
} as IField;
