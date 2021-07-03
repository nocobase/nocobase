import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { createForm } from '@formily/core';
import {
  Field,
  ISchema,
  observer,
  Schema,
  createSchemaField,
  FormProvider,
  useField,
  useFieldSchema,
} from '@formily/react';
import { observable } from '@formily/reactive';
import { uid, clone } from '@formily/shared';
import { ArrayCollapse, ArrayTable, FormLayout } from '@formily/antd';

import { Space, Card, Modal } from 'antd';
import { Action, useLogin, useRegister, useSubmit } from '../action';
import { AddNew } from '../add-new';
import { Cascader } from '../cascader';
import { Checkbox } from '../checkbox';
import { ColorSelect } from '../color-select';
import { DatabaseField } from '../database-field';
import { DatePicker } from '../date-picker';
import { DrawerSelect } from '../drawer-select';
import { Filter } from '../filter';
import { Form } from '../form';
import { Grid } from '../grid';
import { IconPicker } from '../icon-picker';
import { Input } from '../input';
import { InputNumber } from '../input-number';
import { Markdown } from '../markdown';
import { Menu } from '../menu';
import { Password } from '../password';
import { Radio } from '../radio';
import { Select } from '../select';
import { Table } from '../table';
import { Tabs } from '../tabs';
import { TimePicker } from '../time-picker';
import { Upload } from '../upload';
import { FormItem } from '../form-item';

import { CodeOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';

export const BlockContext = createContext({ dragRef: null });

const Div = (props) => <div {...props} />;

export const scope = {
  useLogin,
  useRegister,
  useSubmit,
};

export const components = {
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

export interface DesignableContextProps {
  schema: Schema;
  refresh: () => void;
}

export const DesignableContext = createContext<DesignableContextProps>({
  schema: null,
  refresh: null,
});

export function pathToArray(path): string[] {
  if (Array.isArray(path)) {
    return [...path];
  }

  if (typeof path === 'string') {
    return path.split('.');
  }
}

export function findPropertyByPath(schema: Schema, path?: any): Schema {
  if (!path) {
    return schema;
  }
  const arr = pathToArray(path);
  let property = schema;
  while (arr.length) {
    const name = arr.shift();
    property = property.properties[name];
    if (!property) {
      console.error('property does not exist.');
      break;
    }
  }
  return property;
}

export function addPropertyBefore(target: Schema, data: ISchema) {
  Object.keys(target.parent.properties).forEach((name) => {
    if (name === target.name) {
      target.parent.addProperty(data.name, data);
    }
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
  });
}

export function addPropertyAfter(target: Schema, data: ISchema) {
  Object.keys(target.parent.properties).forEach((name) => {
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
    if (name === target.name) {
      target.parent.addProperty(data.name, data);
    }
  });
}

export function useDesignable(path?: any) {
  const { schema, refresh } = useContext(DesignableContext);
  const schemaPath = path || useSchemaPath();
  const currentSchema = findPropertyByPath(schema, schemaPath);
  console.log('useDesignable', { schema, schemaPath, currentSchema });
  return {
    schema: (currentSchema || {} as any),
    refresh,
    prepend: (property: ISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      const properties = {};
      properties[property.name] = property;
      Object.keys(target.properties).forEach((name, index) => {
        const current = target.properties[name];
        current.parent.removeProperty(current.name);
        properties[current.name] = current.toJSON();
      });
      console.log({ properties }, target.properties)
      target.setProperties(properties);
      refresh();
      return target.properties[property.name];
    },
    appendChild: (property: ISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      target.addProperty(property.name, property);
      // BUG: 空 properties 时，addProperty 无反应。
      const tmp = { name: uid() };
      addPropertyAfter(target, tmp);
      target.parent.removeProperty(tmp.name);
      refresh();
      return target.properties[property.name];
    },
    insertAfter: (property: ISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      addPropertyAfter(target, property);
      refresh();
      return target.parent.properties[property.name];
    },
    insertBefore(property: ISchema, targetPath?: any): Schema {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      addPropertyBefore(target, property);
      refresh();
      return target.parent.properties[property.name];
    },
    deepRemove(targetPath?: any) {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      const remove = (s: Schema) => {
        if (!s.parent) {
          return;
        }
        s.parent.removeProperty(s.name);
        console.log('s.parent.properties', s.name, s.parent.properties)
        if (Object.keys(s.parent.properties || {}).length === 0) {
          remove(s.parent);
        }
      };
      remove(target);
      refresh();
    },
    remove(targetPath?: any) {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      target.parent.removeProperty(target.name);
      refresh();
      return target;
    },
  };
}

export function useSchemaPath() {
  const schema = useFieldSchema();
  const path = [schema.name];
  let parent = schema.parent;
  while (parent) {
    if (!parent.name) {
      break;
    }
    path.unshift(parent.name);
    parent = parent.parent;
  }
  console.log('useSchemaPath', path, schema);
  return [...path];
}

console.log({ scope, components });

export const createDesignableSchemaField = (options) => {
  const SchemaField = createSchemaField(options);

  const DesignableSchemaField = (props) => {
    const schema = useMemo(() => new Schema(props.schema), [props.schema]);
    const [, refresh] = useState(0);
    if (props.designable === false) {
      return <SchemaField schema={schema} />;
    }
    return (
      <DesignableContext.Provider
        value={{
          schema,
          refresh: () => {
            refresh(Math.random());
            props.onRefresh && props.onRefresh(schema);
          },
        }}
      >
        <SchemaField schema={schema} />
        <CodePreview schema={schema} />
      </DesignableContext.Provider>
    );
  };

  return DesignableSchemaField;
};

const CodePreview = ({ schema }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CodeOutlined onClick={() => setVisible(true)} />
      <Modal width={'50%'} onCancel={() => setVisible(false)} visible={visible}>
        <Editor
          height="60vh"
          defaultLanguage="json"
          value={JSON.stringify(schema.toJSON(), null, 2)}
        />
        {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
      </Modal>
    </>
  );
};

export const SchemaField = createSchemaField({
  scope,
  components,
});

export const DesignableSchemaField = createDesignableSchemaField({
  scope,
  components,
});

export interface SchemaRendererProps {
  schema: ISchema;
  form?: any;
  designable?: boolean;
  onRefresh?: any;
  onlyRenderProperties?: boolean;
}

export const SchemaRenderer = (props: SchemaRendererProps) => {
  const form = useMemo(() => props.form || createForm({}), []);

  const schema = useMemo(() => {
    let s = props.schema;
    if (props.onlyRenderProperties) {
      s = {
        type: 'object',
        properties: s.properties,
      };
    } else if (s.name) {
      s = {
        type: 'object',
        properties: {
          [s.name]: s,
        },
      };
    }
    return s;
  }, []);

  console.log('SchemaRenderer', schema, props.schema);

  return (
    <FormProvider form={form}>
      <DesignableSchemaField
        onRefresh={props.onRefresh}
        designable={props.designable}
        schema={schema}
      />
    </FormProvider>
  );
};
