import { ISchema, observer, useFieldSchema } from '@formily/react';
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider, SettingsForm } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    'x-component-props.switch': {
      title: 'Switch',
      'x-component': 'SettingsForm.Switch',
    },
    'x-component-props.select': {
      title: 'Select',
      'x-component': 'SettingsForm.Select',
      enum: [
        { label: 'Option1', value: 'option1' },
        { label: 'Option2', value: 'option2' },
        { label: 'Option3', value: 'option3' },
      ],
    },
    modal: {
      type: 'void',
      title: 'Open Modal',
      'x-component': 'SettingsForm.Modal',
      'x-component-props': {},
      properties: {
        'x-component-props.title': {
          title: '标题',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
    },
    drawer: {
      type: 'void',
      title: 'Open Drawer',
      'x-component': 'SettingsForm.Drawer',
      properties: {
        'x-component-props.title': {
          title: '标题',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
    },
    group: {
      type: 'void',
      title: 'ItemGroup',
      'x-component': 'SettingsForm.ItemGroup',
      properties: {
        'x-component-props': {
          type: 'object',
          title: 'Open Modal',
          'x-component': 'SettingsForm.Modal',
          properties: {
            title: {
              title: '标题',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
        },
      },
    },
    submenu: {
      type: 'void',
      title: 'SubMenu',
      'x-component': 'SettingsForm.SubMenu',
      properties: {
        'x-component-props': {
          type: 'object',
          title: 'Open Modal',
          'x-component': 'SettingsForm.Modal',
          properties: {
            title: {
              title: '标题',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
          },
        },
      },
    },
    divider: {
      'x-component': 'SettingsForm.Divider',
    },
    remove: {
      title: 'Delete',
      'x-component': 'SettingsForm.Remove',
      'x-component-props': {
        confirm: {
          title: 'Are you sure delete this task?',
          content: 'Some descriptions',
        },
      },
    },
  },
};

const Hello = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <pre>{JSON.stringify(props, null, 2)}</pre>
      <pre>{JSON.stringify(fieldSchema.toJSON(), null, 2)}</pre>
      <SettingsForm schema={schema} />
    </div>
  );
});

export default () => {
  return (
    <SchemaComponentProvider components={{ Hello }}>
      <AntdSchemaComponentProvider>
        <SchemaComponent
          schema={{
            type: 'object',
            properties: {
              hello: {
                'x-component': 'Hello',
                'x-component-props': {
                  title: 'abc',
                  switch: true,
                  select: 'option1',
                },
              },
            },
          }}
        />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
