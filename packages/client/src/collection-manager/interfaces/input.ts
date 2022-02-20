import { IField } from './types';

export const input: IField = {
  name: 'input',
  type: 'object',
  group: 'basic',
  order: 1,
  title: '{{t("Single line text")}}',
  sortable: true,
  default: {
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  properties: {
  },
  operators: [
    { label: '{{t("contains")}}', value: '$includes', selected: true },
    { label: '{{t("does not contain")}}', value: '$notIncludes' },
    { label: '{{t("is")}}', value: 'eq' },
    { label: '{{t("is not")}}', value: 'ne' },
    { label: '{{t("is empty")}}', value: '$null', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notNull', noValue: true },
  ],
};
