import { registerTemplate } from '@nocobase/client';
import { SchemaComponentOptions, SchemaInitializerContext } from '@nocobase/client';
import React, { useContext } from 'react';

const myCollectionTemplate = {
  name: 'myCollection',
  type: 'object',
  title: '{{t("Customer collection")}}',
  order: 6,
  color: 'blue',
  presetFields: [
    {
      name: 'uuid',
      type: 'string',
      primaryKey: true,
      allowNull: false,
      uiSchema: { type: 'number', title: '{{t("UUID")}}', 'x-component': 'Input', 'x-read-pretty': true },
      interface: 'input',
    },
  ],
  properties: {
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
  //包含的interface类型
  include: [],
  // 排除的interface类型
  exclude: ['linkTo', 'o2o'],
};

registerTemplate('myCollection', myCollectionTemplate);

export default React.memo((props) => {
  return <>{props.children}</>;
});
