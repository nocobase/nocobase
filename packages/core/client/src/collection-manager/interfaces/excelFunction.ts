import { defaultProps, operators } from './properties';
import { IField } from './types';

export const excelFunction: IField = {
  name: 'excelFunction',
  type: 'object',
  group: 'advanced',
  order: 3,
  title: '{{t("Excel Function")}}',
  description: '{{t("Formula description")}}',
  sortable: true,
  default: {
    type: 'excelFunction',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      "x-disabled": true,
      'x-component': 'ExcelFunction.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  },
  properties: {
    ...defaultProps,
    'expression': {
      type: 'string',
      title: '{{t("Expression")}}',
      required: true,
      description: '{{t("input @ to open field variables.")}}',
      'x-component': 'ExcelFunction.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        'supports': ['number', 'percent', 'integer'],
        'useCurrentFields': '{{ useCurrentFields }}'
      },
    }
  },
  filterable: {
    operators: operators.number,
  },
};
