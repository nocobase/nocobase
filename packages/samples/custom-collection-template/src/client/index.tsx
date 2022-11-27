import { registerTemplate } from '@nocobase/client';
import React from 'react';

const myCollectionTemplate = {
  name: 'myCollection',
  type: 'object',
  title: '{{t("Custom template")}}',
  order: 6,
  color: 'blue',
  default: {
    fields: [
      {
        name: 'uuid',
        type: 'string',
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("UUID")}}', 'x-component': 'Input', 'x-read-pretty': true },
        interface: 'input',
      },
    ],
  },
  configurableProperties: {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
    },
    createdAt: {
      type: 'boolean',
      'x-content': '{{t("CreatedAt")}}',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
    },
    updatedAt: {
      type: 'boolean',
      'x-content': '{{t("UpdatedAt")}}',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
    },
    sortable: {
      type: 'boolean',
      'x-content': '{{t("Sortable")}}',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-disabled': '{{ !createOnly }}',
    },
  },
  availableFieldInterfaces: {
    exclude: ['linkTo', 'o2o'],
  },
};

registerTemplate('myCollection', myCollectionTemplate);

export default React.memo((props) => {
  return <>{props.children}</>;
});
