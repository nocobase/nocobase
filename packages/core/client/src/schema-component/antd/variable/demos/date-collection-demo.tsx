import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import {
  Plugin,
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsModalItem,
  Variable,
  VariableEvaluateProvider,
  useVariableEvaluateContext,
  CollectionField,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { dayjs } from '@nocobase/utils/client';
import React from 'react';

const DefaultValueEditor = () => {
  const fieldSchema = useFieldSchema();
  const collectionField = fieldSchema['x-component-props']?.['field'];
  const fieldType = collectionField?.interface;

  // Define date variable scopes based on field type
  const dateScopes = {
    date: [
      { label: 'Today', value: 'today_dateOnly' },
      { label: 'Yesterday', value: 'yesterday_dateOnly' },
      { label: 'Tomorrow', value: 'tomorrow_dateOnly' },
    ],
    datetime: [
      { label: 'Now', value: 'now_withTZ' },
      { label: 'Today', value: 'today_withTZ' },
      { label: 'Yesterday', value: 'yesterday_withTZ' },
      { label: 'Tomorrow', value: 'tomorrow_withTZ' },
    ],
    datetimeNoTz: [
      { label: 'Now', value: 'now_withoutTZ' },
      { label: 'Today', value: 'today_withoutTZ' },
      { label: 'Yesterday', value: 'yesterday_withoutTZ' },
      { label: 'Tomorrow', value: 'tomorrow_withoutTZ' },
    ],
  };

  const scope = dateScopes[fieldType] || [];

  // Define data with various date formats
  const data = {
    // Date only formats
    today_dateOnly: dayjs().format('YYYY-MM-DD'),
    yesterday_dateOnly: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    tomorrow_dateOnly: dayjs().add(1, 'day').format('YYYY-MM-DD'),

    // Datetime with timezone formats
    now_withTZ: new Date().toISOString(),
    today_withTZ: dayjs().startOf('day').toISOString(),
    yesterday_withTZ: dayjs().subtract(1, 'day').startOf('day').toISOString(),
    tomorrow_withTZ: dayjs().add(1, 'day').startOf('day').toISOString(),

    // Datetime without timezone formats
    now_withoutTZ: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    today_withoutTZ: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    yesterday_withoutTZ: dayjs().subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    tomorrow_withoutTZ: dayjs().add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
  };

  const defaultValueSchema = {
    type: 'object',
    'x-component-props': {
      data,
      context: {},
    },
    properties: {
      variable: {
        'x-decorator': 'FormItem',
        'x-component': 'VariableInput',
      },
      value: {
        'x-decorator': 'FormItem',
        'x-component': 'VariableValue',
      },
    },
  };

  const VariableInput = (props) => {
    return (
      <VariableEvaluateProvider data={data} context={{}}>
        <Variable.Input scope={scope} {...props} />
      </VariableEvaluateProvider>
    );
  };

  return (
    <VariableEvaluateProvider data={data} context={{}}>
      <SchemaSettingsModalItem
        title={'Set default value'}
        width={800}
        onSubmit={(v) => null}
        schema={defaultValueSchema}
        components={{ VariableInput }}
      />
    </VariableEvaluateProvider>
  );
};

const dateSettings = new SchemaSettings({
  name: 'dateSettings',
  items: [
    {
      name: 'defaultValue',
      Component: DefaultValueEditor,
    },
  ],
});

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormBlockProvider',
  'x-decorator-props': {
    collection: 'date_collection', // users 数据表
    dataSource: 'main', // 多数据源标识，可以不写，默认为 main
  },
  'x-component': 'FormV2',
  properties: {
    dateonly: {
      type: 'string',
      title: 'DateOnly',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionField',
      'x-settings': 'dateSettings',
      required: true,
    },
    datetime: {
      type: 'string',
      title: 'Datetime with Timezone',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionField',
      'x-settings': 'dateSettings',
      'x-component-props': {
        field: {
          interface: 'datetime',
          type: 'date',
          uiSchema: {
            'x-component': 'DatePicker',
            'x-component-props': {
              showTime: true,
              utc: true,
            },
          },
        },
      },
      required: true,
    },
    datetime_withoutTZ: {
      type: 'string',
      title: 'Datetime without Timezone',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionField',
      'x-settings': 'dateSettings',
      'x-component-props': {
        field: {
          interface: 'datetimeNoTz',
          type: 'datetimeNoTz',
          uiSchema: {
            'x-component': 'DatePicker',
            'x-component-props': {
              showTime: true,
              utc: false,
            },
          },
        },
      },
      required: true,
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin],
  schemaSettings: [dateSettings],
});

export default app.getRootComponent();
