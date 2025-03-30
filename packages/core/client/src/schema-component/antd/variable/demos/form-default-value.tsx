import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import {
  Plugin,
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsModalItem,
  Variable,
  VariableEvaluateProvider,
  isVariable,
  useApp,
  useDesignable,
  useVariableEvaluateContext,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { dayjs } from '@nocobase/utils/client';
import React, { useEffect } from 'react';
const data = {
  today_dateOnly: dayjs().format('YYYY-MM-DD'),
  today_withTZ: new Date().toISOString(),
  today_withoutTZ: dayjs().format('YYYY-MM-DD HH:mm:ss'),
};

const useDefaultValue = () => {
  const field = useField<any>();
  const fieldSchema = useFieldSchema();
  const app = useApp();
  useEffect(() => {
    if (isVariable(fieldSchema.default)) {
      app.jsonTemplateParser
        .render(fieldSchema.default, data, {})
        .then((value) => {
          field.setInitialValue?.(value);
        })
        .catch((err) => console.error(err));
    }
  }, [app.jsonTemplateParser, field, fieldSchema.default]);
};
const DefaultValueEditor = () => {
  const fieldSchema = useFieldSchema();
  const field = useField<any>();
  const { dn } = useDesignable();
  const TodayKeyMap = {
    dateOnly: 'today_dateOnly',
    datetime_withTZ: 'today_withTZ',
    datetime_withoutTZ: 'today_withoutTZ',
  };
  const scope = [{ label: 'Today', value: `${TodayKeyMap[fieldSchema['x-field-type']]}` }];

  const defaultValueSchema = {
    type: 'object',
    'x-component-props': {
      data: {
        today_dateOnly: dayjs().format('YYYY-MM-DD'),
        today_withTZ: new Date().toISOString(),
        today_withoutTZ: dayjs().format('YYYY-MM-DD 00:00:00'),
      },
      context: {},
    },

    properties: {
      variable: {
        'x-decorator': 'FormItem',
        'x-component': 'VariableInput',
      },
      value: {
        'x-decorator': 'FormItem',
        'x-component': 'VairableValue',
      },
    },
  };

  const VariableInput = (props) => {
    return (
      <VariableEvaluateProvider data={data} context={{}}>
        <Variable.Input scope={scope} {...props} useTypedConstant={['string', 'number', 'boolean', 'date']} />
      </VariableEvaluateProvider>
    );
  };

  return (
    <VariableEvaluateProvider data={data} context={{}}>
      <SchemaSettingsModalItem
        title={'Set default value'}
        width={800}
        onSubmit={(v) => {
          const schema: ISchema = {
            ['x-uid']: fieldSchema['x-uid'],
          };
          fieldSchema.default = v.variable ?? null;
          if (!isVariable(v.variable)) {
            field.setInitialValue?.(v.variable);
          }
          schema.default = v.variable ?? null;
          dn.emit('patch', {
            schema,
          });
          dn.refresh();
        }}
        schema={defaultValueSchema}
        components={{ VariableInput }}
      />
    </VariableEvaluateProvider>
  );
};

const simpleSettings = new SchemaSettings({
  name: 'simpleSettings',
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
  'x-decorator': 'DndContext',
  'x-component': 'FormV2',
  properties: {
    dateonly: {
      type: 'string',
      title: 'Dateonly',
      default: '2023-01-01',
      'x-decorator': 'FormItem',
      'x-use-decorator-props': 'useDefaultValue',
      'x-component': 'Input',
      'x-settings': 'simpleSettings',
      'x-field-type': 'dateOnly',
      required: true,
    },
    datetime_withTZ: {
      type: 'string',
      title: 'Datetime with Timezone',
      'x-decorator': 'FormItem',
      'x-use-decorator-props': 'useDefaultValue',
      'x-component': 'Input',
      'x-settings': 'simpleSettings',
      'x-field-type': 'datetime_withTZ',
    },
    datetime_withoutTZ: {
      type: 'string',
      title: 'Datetime without Timezone',
      'x-decorator': 'FormItem',
      'x-use-decorator-props': 'useDefaultValue',
      'x-component': 'Input',
      'x-settings': 'simpleSettings',
      'x-field-type': 'datetime_withoutTZ',
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} scope={{ useDefaultValue }} />;
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  designable: true,
  plugins: [DemoPlugin],
  schemaSettings: [simpleSettings],
});

export default app.getRootComponent();
