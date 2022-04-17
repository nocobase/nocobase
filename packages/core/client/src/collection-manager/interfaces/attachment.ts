import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { defaultProps, operators } from './properties';
import { IField } from './types';

export const attachment: IField = {
  name: 'attachment',
  type: 'object',
  group: 'media',
  title: '{{t("Attachment")}}',
  isAssociation: true,
  default: {
    type: 'belongsToMany',
    target: 'attachments',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Upload.Attachment',
      'x-component-props': {
        action: 'attachments:upload',
      },
    },
  },
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
    'uiSchema.x-component-props.accept': {
      type: 'string',
      title: '{{t("Accept")}}',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      description: 'Example: .doc,.docx',
    },
    'uiSchema.x-component-props.multiple': {
      type: 'boolean',
      'x-content': "{{t('Allow uploading multiple files')}}",
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: true,
    },
  },
  filterable: {
    children: [
      {
        name: 'id',
        title: '{{t("Exists")}}',
        operators: [
          { label: '{{t("exists")}}', value: '$exists', noValue: true },
          { label: '{{t("not exists")}}', value: '$notExists', noValue: true },
        ],
        schema: {
          title: '{{t("Exists")}}',
          type: 'string',
          'x-component': 'Input',
        },
      },
      {
        name: 'filename',
        title: '{{t("Filename")}}',
        operators: operators.string,
        schema: {
          title: '{{t("Filename")}}',
          type: 'string',
          'x-component': 'Input',
        },
      },
    ],
  },
};
