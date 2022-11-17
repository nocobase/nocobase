import { IField, interfacesProperties } from '@nocobase/client';
const { defaultProps, operators } = interfacesProperties;

export const excelFormula: IField = {
  name: 'excelFormula',
  type: 'object',
  group: 'advanced',
  order: 2,
  title: '{{t("Excel formula")}}',
  description: '{{t("Compute a value based on the other fields using excel formula functions")}}',
  sortable: true,
  default: {
    type: 'excelFormula',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-disabled': true,
      'x-component': 'ExcelFormula.Result',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
    },
  },
  properties: {
    ...defaultProps,
    dataType: {
      type: 'string',
      title: '{{t("Data type")}}',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      default: 'number',
      'x-disabled': '{{ !createOnly }}',
      enum: [
        { value: 'string', label: '{{t("String")}}' },
        { value: 'number', label: '{{t("Number")}}' },
      ],
    },
    expression: {
      type: 'string',
      title: '{{t("Expression")}}',
      required: true,
      description: '{{t("Input @ to open field variables.")}}',
      'x-component': 'ExcelFormula.Expression',
      'x-decorator': 'FormItem',
      'x-component-props': {
        supports: ['number', 'percent', 'integer', 'string'],
        useCurrentFields: '{{ useCurrentFields }}',
      },
    },
  },
  filterable: {
    operators: operators.string,
  },
};
