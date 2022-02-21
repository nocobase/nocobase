import { uid } from '@formily/shared';
import { defaultProps } from './properties';
import { IField } from './types';

export const subTable: IField = {
  name: 'subTable',
  type: 'object',
  group: 'relation',
  order: 2,
  title: '{{t("Sub-table")}}',
  isAssociation: true,
  disabled: true,
  default: {
    type: 'hasMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Table',
      'x-component-props': {},
      enum: [],
    },
  },
  initialize: (values: any) => {
    if (!values.target) {
      values.target = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
  },
  properties: {
    ...defaultProps,
    // children: {
    //   type: 'array',
    //   title: '{{t("Sub-table fields")}}',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'DatabaseField',
    // },
  },
};
