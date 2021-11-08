import { defaultProps } from './properties';
import { uid } from '@formily/shared';
import { FieldOptions } from '.';

export const subTable: FieldOptions = {
  name: 'subTable',
  type: 'object',
  group: 'relation',
  order: 2,
  title: '{{t("Sub-table")}}',
  isAssociation: true,
  disabled: true,
  default: {
    dataType: 'hasMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Table',
      'x-component-props': {},
      'x-designable-bar': 'Table.DesignableBar',
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
    children: {
      type: 'array',
      title: '{{t("Sub-table fields")}}',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
    },
  },
};
