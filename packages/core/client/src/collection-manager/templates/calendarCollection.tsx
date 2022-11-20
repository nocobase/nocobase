import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const calendarCollection: IField = {
  name: 'calendarCollection',
  type: 'object',
  title: '{{t("Calendar collection")}}',
  isAssociation: true,
  order: 1,
  presetFields: [
    {
      name: 'cron',
      type: 'boolean',
      allowNull: false,
      uiSchema: { type: 'boolean', title: '{{t("Cron")}}', 'x-component': 'CheckBox', 'x-read-pretty': true },
      interface: 'checkbox',
    },
    {
      name: 'exclude',
      type: 'date',
      allowNull: false,
      interface: 'datetime',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Exclude")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
  ],
  schemaInitialize(schema: ISchema, { block }) {
    if (['Table', 'Kanban'].includes(block)) {
      schema['x-component-props'] = schema['x-component-props'] || {};
      schema['x-component-props']['size'] = 'small';
    }
  },
  initialize: (values: any) => {
    if (!values.through) {
      values.through = `t_${uid()}`;
    }
    if (!values.foreignKey) {
      values.foreignKey = `f_${uid()}`;
    }
    if (!values.otherKey) {
      values.otherKey = `f_${uid()}`;
    }
    if (!values.sourceKey) {
      values.sourceKey = 'id';
    }
    if (!values.targetKey) {
      values.targetKey = 'id';
    }
  },
  properties: {
    ...defaultProps,
    sortable: {
      type: 'boolean',
      title: '{{t("Sortable")}}',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
    },
    inherits: {
      type: 'boolean',
      title: '{{t("Allow inherits")}}',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
    },
  },
};
