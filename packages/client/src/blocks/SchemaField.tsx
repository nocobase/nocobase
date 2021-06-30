import React, { createContext, useState } from 'react';
import {
  // FormItem,
  FormLayout,
  FormButtonGroup,
  Submit,
  ArrayTable,
  ArrayCollapse,
} from '@formily/antd';
import { createForm } from '@formily/core';
import {
  Schema,
  ISchema,
  useForm,
  FormProvider,
  createSchemaField,
  observer,
  useFieldSchema,
} from '@formily/react';
import { Space, Card } from 'antd';
import { Action, useLogin, useRegister, useSubmit } from './action';
import { AddNew } from './add-new';
import { Cascader } from './cascader';
import { Checkbox } from './checkbox';
import { ColorSelect } from './color-select';
import { DatabaseField } from './database-field';
import { DatePicker } from './date-picker';
import { DrawerSelect } from './drawer-select';
import { Filter } from './filter';
import { Form } from './form';
import { Grid } from './grid';
import { IconPicker } from './icon-picker';
import { Input } from './input';
import { InputNumber } from './input-number';
import { Markdown } from './markdown';
import { Menu } from './menu';
import { Password } from './password';
import { Radio } from './radio';
import { Select } from './select';
import { Table } from './table';
import { Tabs } from './tabs';
import { TimePicker } from './time-picker';
import { Upload } from './upload';
import { FormItem } from './form-item';

export const BlockContext = createContext({ dragRef: null });

const Div = (props) => <div {...props} />;

const scope = {
  useLogin,
  useRegister,
  useSubmit,
};

const components = {
  Div,
  Space,
  Card,

  ArrayCollapse,
  ArrayTable,
  FormLayout,
  FormItem,

  Action,
  AddNew,
  Cascader,
  Checkbox,
  ColorSelect,
  DatabaseField,
  DatePicker,
  DrawerSelect,
  Filter,
  Form,
  Grid,
  IconPicker,
  Input,
  InputNumber,
  Markdown,
  Menu,
  Password,
  Radio,
  Select,
  Table,
  Tabs,
  TimePicker,
  Upload,
};

export function registerScope(scopes) {
  Object.keys(scopes).forEach((key) => {
    scope[key] = scopes[key];
  });
}

export function registerComponents(values) {
  Object.keys(values).forEach((key) => {
    components[key] = values[key];
  });
}

export const SchemaField = createSchemaField({
  scope,
  components,
});

export const DesignableSchemaContext = createContext<Schema>(new Schema({}));
export const RefreshDesignableSchemaContext = createContext(null);

export function DesignableProvider(props) {
  const { schema } = props;
  const [, refresh] = useState(0);
  return (
    <RefreshDesignableSchemaContext.Provider
      value={() => {
        refresh(Math.random());
      }}
    >
      <DesignableSchemaContext.Provider value={schema}>
        {props.children(schema)}
      </DesignableSchemaContext.Provider>
      {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
    </RefreshDesignableSchemaContext.Provider>
  );
}

export const DesignableContext =
  createContext<{ schema: Schema; refresh: any }>(null);

export function DesignableSchemaField(props: { schema?: ISchema }) {
  return (
    <DesignableProvider schema={new Schema(props.schema)}>
      {(s) => <SchemaField schema={s} />}
    </DesignableProvider>
  );
}
