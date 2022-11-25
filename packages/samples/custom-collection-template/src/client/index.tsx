import { registerTemplace } from '@nocobase/client';
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
    {
      interface: 'createdAt',
      type: 'date',
      field: 'createdAt',
      name: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
    {
      interface: 'createdBy',
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'createdById',
      name: 'createdBy',
      uiSchema: {
        type: 'object',
        title: '{{t("Created by")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
    },
    {
      type: 'date',
      field: 'updatedAt',
      name: 'updatedAt',
      interface: 'updatedAt',
      uiSchema: {
        type: 'string',
        title: '{{t("Last updated at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    },
    {
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'updatedById',
      name: 'updatedBy',
      interface: 'updatedBy',
      uiSchema: {
        type: 'object',
        title: '{{t("Last updated by")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'nickname',
          },
        },
        'x-read-pretty': true,
      },
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

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);

  registerTemplace('myCollection', myCollectionTemplate);

  return (
    <SchemaComponentOptions>
      <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
    </SchemaComponentOptions>
  );
});
