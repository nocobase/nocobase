import { IField, interfacesProperties } from '@nocobase/client';
const { defaultProps, operators } = interfacesProperties;

export const excelFunction: IField = {
  name: 'excelFunction',
  type: 'object',
  group: 'advanced',
  order: 3,
  title: '{{t("Excel Function")}}',
  description: '{{t("Compute a value based on the other fields using Excel functions")}}',
  sortable: true,
  default: {
    type: 'excelFunction',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-disabled': true,
      'x-component': 'ExcelFunction.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  },
  properties: {
    ...defaultProps,
    expression: {
      type: 'string',
      title: '{{t("Expression")}}',
      required: true,
      description: '{{t("Input @ to open field variables.")}}',
      'x-component': 'ExcelFunction.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        supports: ['number', 'percent', 'integer'],
        useCurrentFields: '{{ useCurrentFields }}',
      },
    },
  },
  filterable: {
    operators: operators.number,
  },
};
