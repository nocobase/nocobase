import { defaultProps } from './properties';
import { IField } from './types';

export const updatedBy: IField = {
  name: 'updatedBy',
  type: 'object',
  group: 'systemInfo',
  order: 4,
  title: '{{t("Last updated by")}}',
  isAssociation: true,
  default: {
    type: 'belongsTo',
    target: 'users',
    foreignKey: 'updatedById',
    uiSchema: {
      type: 'object',
      title: '{{t("Last updated by")}}',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-read-pretty': true,
    },
  },
  properties: {
    ...defaultProps,
  },
};
