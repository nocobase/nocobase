import React, { useMemo } from 'react';
import { Form, FormItem, FormLayout, Space } from '@formily/antd';
import { FormProvider, createSchemaField } from '@formily/react';
import { createForm } from '@formily/core';
import * as core from '@formily/core';
import { Select } from './select';
import { Input } from './input';
import { InputNumber } from './input-number';
import { IconPicker } from './icon-picker';
import { ColorSelect } from './color-select';
import { Cascader } from './cascader';
import { Checkbox } from './checkbox';
import { DatePicker } from './date-picker';
import { DrawerSelect } from './drawer-select';
import { Filter } from './filter';
import { Markdown } from './markdown';
import { Password } from './password';
import { Radio } from './radio';
import { TimePicker } from './time-picker';

export function fields2properties(fields: any) {
  const items = Array.isArray(fields) ? fields : [fields];
  const properties = {};
  items.forEach((field) => {
    const { name, dataSource, ...property } = field;
    properties[name] = {
      'x-decorator': 'FormItem',
      enum: dataSource,
      ...property,
    };
  });
  return properties;
}

const fieldComponents = {
  Input,
  InputNumber,
  FormItem,
  Select,
  IconPicker,
  ColorSelect,
  FormLayout,
  Cascader,
  Checkbox,
  DatePicker,
  DrawerSelect,
  Filter,
  Markdown,
  Password,
  Radio,
  Space,
  TimePicker,
  Column: ({ children }) => children,
};

const fieldScope = {};

export function registerFieldComponents(components) {
  Object.keys(components).forEach(displayName => {
    fieldComponents[displayName] = components[displayName];
  });
}

export function getFieldComponent(displayName: string) {
  return fieldComponents[displayName]
}

export function registerFieldScope(scopes) {
  Object.keys(scopes).forEach(name => {
    fieldScope[name] = scopes[name];
  });
}

export const SchemaField = createSchemaField({
  components: fieldComponents,
  scope: fieldScope,
});

export function parseEffects(effects: any, form?: any) {
  if (!effects) {
    return;
  }
  if (typeof effects === 'function') {
    effects(form);
  }
  if (typeof effects === 'object') {
    Object.keys(effects || {}).forEach((key) => {
      const fn = core[key];
      if (key.startsWith('on') && fn) {
        fn(effects[key]);
      }
    });
  }
}

export interface FieldProps {
  schema: any;
  data?: any;
  readPretty?: boolean;
  [key: string]: any;
}

export function Field(props: FieldProps) {
  const { schema, readPretty, data, effects } = props;
  const form = props.form || useMemo(
    () =>
      createForm({
        initialValues: data,
        readPretty,
        effects: (form) => parseEffects(effects, form),
      }),
    [],
  );
  return (
    <div>
      <FormProvider form={form}>
        <SchemaField
          schema={{
            type: 'object',
            properties: {
              layout: {
                type: 'void',
                properties: fields2properties(schema),
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'horizontal',
                },
              },
            },
          }}
        />
      </FormProvider>
    </div>
  );
}
