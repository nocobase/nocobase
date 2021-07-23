import { createForm } from '@formily/core';
import {
  createSchemaField,
  FormProvider,
  ISchema,
  Schema,
  SchemaOptionsContext,
  useFieldSchema,
  useForm,
} from '@formily/react';
import { uid } from '@formily/shared';
import constate from 'constate';
import { get } from 'lodash';
import React, { createContext } from 'react';
import { useState } from 'react';
import { useContext } from 'react';
import { useMemo } from 'react';

import { CodeOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';

import { ArrayCollapse, FormLayout, FormItem as FormilyFormItem } from '@formily/antd';

import { Space, Card, Modal, Spin } from 'antd';
import { ArrayTable } from '../../schemas/array-table';
import { Action } from '../../schemas/action';
import { AddNew } from '../../schemas/add-new';
import { Cascader } from '../../schemas/cascader';
import { Checkbox } from '../../schemas/checkbox';
import { ColorSelect } from '../../schemas/color-select';
import { DatabaseField, DatabaseCollection } from '../../schemas/database-field';
import { DatePicker } from '../../schemas/date-picker';
import { Filter } from '../../schemas/filter';
import { Form } from '../../schemas/form';
import { Grid } from '../../schemas/grid';
import { IconPicker } from '../../schemas/icon-picker';
import { Input } from '../../schemas/input';
import { InputNumber } from '../../schemas/input-number';
import { Markdown } from '../../schemas/markdown';
import { Menu } from '../../schemas/menu';
import { Password } from '../../schemas/password';
import { Radio } from '../../schemas/radio';
import { Select } from '../../schemas/select';
import { Table } from '../../schemas/table';
import { Tabs } from '../../schemas/tabs';
import { TimePicker } from '../../schemas/time-picker';
import { Upload } from '../../schemas/upload';
import { FormItem } from '../../schemas/form-item';
import { BlockItem } from '../../schemas/block-item';
import { CardItem } from '../../schemas/card-item';
import { DragAndDrop } from '../../schemas/drag-and-drop';
import { TreeSelect } from '../../schemas/tree-select';
import { Page } from '../../schemas/page';
import { useCollectionContext, useSwithDesignableContext } from '../../schemas';

export const BlockContext = createContext({ dragRef: null });

const Div = (props) => <div {...props} />;

interface DesignableContextProps {
  schema?: Schema;
  refresh?: any;
}

export const SchemaField = createSchemaField({
  scope: {
    Table,
  },
  components: {
    Card,
    Div,
    Space,
    Page,

    ArrayCollapse,
    ArrayTable,
    FormLayout,
    TreeSelect,
    FormilyFormItem,

    DragAndDrop,

    BlockItem,
    CardItem,
    FormItem,

    Action,
    AddNew,
    Cascader,
    Checkbox,
    ColorSelect,
    DatabaseField,
    DatabaseCollection,
    DatePicker,
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
  },
});

export const DesignableContext = createContext<DesignableContextProps>({});

export function useSchema(path?: any) {
  const { schema, refresh } = useContext(DesignableContext);
  return { schema, refresh };
}

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
    if (!property.properties) {
      console.warn('property does not exist.');
      return null;
    }
    property = property.properties[name];
    if (!property) {
      console.warn('property does not exist.');
      return null;
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

function setKeys(schema: ISchema, parentKey = null) {
  if (!schema['key']) {
    schema['key'] = uid();
  }
  if (parentKey && !schema['parentKey']) {
    schema['parentKey'] = parentKey;
  }
  Object.keys(schema.properties || {}).forEach((name) => {
    setKeys(schema.properties[name], schema['key']);
  });
}

export function useSchemaComponent(component: string) {
  if (!component) {
    return null;
  }
  const options = useContext(SchemaOptionsContext);
  return get(options.components, component);
}

export function useDesignable(path?: any) {
  const { designable } = useSwithDesignableContext();
  const { schema = new Schema({}), refresh } = useContext(DesignableContext);
  const schemaPath = path || useSchemaPath();
  const fieldSchema = useFieldSchema();
  let current;
  let currentSchema = current =
    findPropertyByPath(schema, schemaPath) || ({} as Schema);
  if (!currentSchema) {
    currentSchema = fieldSchema;
  }
  if (Object.keys(currentSchema).length === 0) {
    currentSchema = fieldSchema;
  }
  // console.log('useDesignable', { schema, schemaPath, currentSchema });
  const options = useContext(SchemaOptionsContext);
  const DesignableBar =
    get(options.components, currentSchema['x-designable-bar']) || (() => null);
  return {
    designable,
    root: schema,
    currentSchema: current,
    DesignableBar,
    schema: currentSchema,
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
      if (target['key']) {
        property['parentKey'] = target['key'];
        setKeys(property);
        property['__prepend__'] = true;
        // if (!property['key']) {
        //   property['key'] = uid();
        // }
      }
      const properties = {};
      properties[property.name] = property;
      Object.keys(target.properties).forEach((name, index) => {
        const current = target.properties[name];
        current.parent.removeProperty(current.name);
        properties[current.name] = current.toJSON();
      });
      // console.log({ properties }, target.properties);
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
      if (target['key']) {
        property['parentKey'] = target['key'];
        // if (!property['key']) {
        //   property['key'] = uid();
        // }
        setKeys(property);
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
      console.log('target.parentKey', target);
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertAfter__'] = target['key'];
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
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertBefore__'] = target['key'];
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
      const removed = [];
      const remove = (s: Schema) => {
        if (!s.parent) {
          return;
        }
        s.parent.removeProperty(s.name);
        removed.push(s);
        if (s['x-component'] === 'Grid.Row') {
          return;
        }
        if (Object.keys(s.parent.properties || {}).length === 0) {
          remove(s.parent);
        }
      };
      console.log({ removed })
      remove(target);
      refresh();
      return removed;
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

export function getSchemaPath(schema: Schema) {
  const path = schema['x-path'] || [schema.name];
  let parent = schema.parent;
  while (parent) {
    // if (!parent.name) {
    //   break;
    // }
    if (parent['x-path']) {
      path.unshift(...parent['x-path']);
    } else if (parent.name) {
      path.unshift(parent.name);
    }
    parent = parent.parent;
  }
  // console.log('getSchemaPath', path, schema);
  return [...path];
}

export function useSchemaPath() {
  const schema = useFieldSchema();
  const path = getSchemaPath(schema);
  return [...path];
}

const FormValues = () => {
  const form = useForm();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CodeOutlined onClick={() => setVisible(true)} />
      <Modal
        width={'50%'}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
        visible={visible}
      >
        <Editor
          height="60vh"
          defaultLanguage="json"
          value={JSON.stringify(form.values, null, 2)}
        />
        {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
      </Modal>
    </>
  );
};

const CodePreview = ({ schema }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CodeOutlined
        style={{ position: 'relative', zIndex: 100 }}
        onClick={() => setVisible(true)}
      />
      <Modal
        width={'50%'}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
        visible={visible}
      >
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

export interface SchemaRendererProps {
  schema: Schema | ISchema;
  form?: any;
  render?: any;
  components?: any;
  scope?: any;
  debug?: boolean;
  onlyRenderProperties?: boolean;
  onRefresh?: any;
  [key: string]: any;
}

export const SchemaRenderer = (props: SchemaRendererProps) => {
  const { designable } = useSwithDesignableContext();
  const [, refresh] = useState(uid());
  const form = useMemo(() => props.form || createForm(), []);
  const schema = useMemo(() => {
    if (Schema.isSchemaInstance(props.schema)) {
      return schema;
    }
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
    return new Schema(s);
  }, []);
  // useEffect(() => {
  //   refresh(uid());
  // }, [designable]);
  console.log({ designable }, 'designable')
  const defaultRender = ({ schema }) => (
    <FormProvider form={form}>
      <SchemaField
        components={props.components}
        scope={props.scope}
        schema={schema}
      />
      {props.debug && <CodePreview schema={schema} />}
      {props.debug && <FormValues />}
    </FormProvider>
  );
  return (
    <DesignableContext.Provider
      value={{
        schema,
        refresh: () => {
          props.onRefresh && props.onRefresh(schema);
          refresh(uid());
        },
      }}
    >
      <DesignableContext.Consumer>
        {props.render || defaultRender}
      </DesignableContext.Consumer>
    </DesignableContext.Provider>
  );
};
