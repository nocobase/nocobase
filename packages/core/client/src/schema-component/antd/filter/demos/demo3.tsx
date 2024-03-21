import { ISchema, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  Application,
  Filter,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useActionContext,
} from '@nocobase/client';
import React from 'react';

const dataSource = [
  {
    name: 'name',
    title: 'Name',
    operators: [
      { label: 'eq', value: '$eq' },
      { label: 'ne', value: '$ne' },
    ],
    schema: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input',
    },
  },
  {
    name: 'age',
    title: 'Age',
    operators: [
      { label: 'in', value: '$in' },
      { label: 'not', value: '$not' },
    ],
    schema: {
      type: 'string',
      title: 'Age',
      'x-component': 'InputNumber',
    },
  },
  {
    name: 'tags',
    title: 'Tags',
    schema: {
      title: 'Tags',
    },
    children: [
      {
        name: 'slug',
        title: 'Slug',
        operators: [
          { label: 'in', value: '$in' },
          { label: 'not', value: '$not' },
        ],
        schema: {
          title: 'Slug',
          type: 'string',
          'x-component': 'Input',
        },
      },
      {
        name: 'title',
        title: 'Title',
        operators: [
          { label: 'eq', value: '$eq' },
          { label: 'ne', value: '$ne' },
        ],
        schema: {
          title: 'Title',
          type: 'string',
          'x-component': 'Input',
        },
      },
    ],
  },
];

const defaultValue = {
  $or: [
    {
      name: {
        $ne: 'aa',
      },
    },
    {
      'tags.title': {
        $eq: 'aaa',
      },
    },
  ],
};

const schema: ISchema = {
  type: 'object',
  properties: {
    action1: {
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        popover: true,
        openMode: 'popover',
      },
      type: 'void',
      title: 'Open',
      properties: {
        popover: {
          type: 'void',
          'x-decorator': 'Form',
          'x-decorator-props': {},
          'x-component': 'Action.Popover',
          'x-component-props': {
            trigger: 'click',
            placement: 'bottomLeft',
          },
          properties: {
            filter: {
              type: 'object',
              default: defaultValue,
              'x-component': 'Filter',
              'x-component-props': {
                options: dataSource,
              },
            },
            footer: {
              type: 'void',
              'x-component': 'Action.Popover.Footer',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  properties: {
                    saveDefault: {
                      type: 'void',
                      title: 'Submit',
                      'x-component': 'Filter.SaveDefaultValue',
                      'x-component-props': {},
                    },
                    submit: {
                      type: 'void',
                      title: 'Submit',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction() {
                          const form = useForm();
                          const ctx = useActionContext();
                          return {
                            async run() {
                              ctx.setVisible(false);
                              console.log('form.values', JSON.stringify(form.values, null, 2));
                            },
                          };
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const Root = () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Input, Filter }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
