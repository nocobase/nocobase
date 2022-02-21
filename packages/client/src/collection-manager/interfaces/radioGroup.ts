import { dataSource, defaultProps } from './properties';
import { select } from './select';
import { IField } from './types';

export const radioGroup: IField = {
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '{{t("Radio group")}}',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operators: select.operators,
};
