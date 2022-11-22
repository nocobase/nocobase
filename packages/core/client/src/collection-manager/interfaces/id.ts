import { operators } from './properties';
import { IField } from './types';

export const id: IField = {
  name: 'id',
  type: 'object',
  group: 'systemInfo',
  order: 0,
  title: '{{t("ID")}}',
  sortable: true,
  default: {
    name: 'id',
    type: 'bigInt',
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    uiSchema: {
      type: 'number',
      title: '{{t("ID")}}',
      'x-component': 'InputNumber',
      'x-read-pretty': true,
    },
  },
  properties: {
    'uiSchema.title': {
      type: 'string',
      title: '{{t("Field display name")}}',
      required: true,
      default: 'ID',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Field name")}}',
      required: true,
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
  },
  filterable: {
    operators: operators.id,
  },
};
