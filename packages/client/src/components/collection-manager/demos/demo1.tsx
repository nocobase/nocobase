import React, { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { createForm, VoidField } from '@formily/core';
import { createSchemaField, RecursionField, useForm, useField, observer, Schema, useFieldSchema } from '@formily/react';
import { Form, FormItem, Input, Select } from '@formily/antd';
import { Button, Space } from 'antd';
import { uid } from '@formily/shared';

const DesignableContext = createContext(null);
const UidContext = createContext<any>({});

const Hello: React.FC<any> = observer((props) => {
  const field = useField();
  const form = useForm();
  // const fieldSchema = useFieldSchema();
  const [fieldSchema, setFieldSchema] = useState(useFieldSchema());

  return (
    <div>
      <h1>Hello {props.name}</h1>
      <h2>{field.componentProps.name}</h2>
      <h2>{fieldSchema['x-component-props']['name']}</h2>
      <Space>
        <Button
          onClick={() => {
            form.clearFormGraph(field.address);
            form.deleteValuesIn(field.path);
            const name = uid();
            // field.componentProps.name = name;
            fieldSchema['x-component-props']['name'] = name;
            setFieldSchema(fieldSchema);
            // refresh();
          }}
        >
          Update
        </Button>
        <Button
          onClick={() => {
            const name = uid();
            fieldSchema.parent.addProperty(name, {
              type: 'void',
              'x-component': 'Hello',
              'x-component-props': {
                name: 'World',
              },
            });
            setFieldSchema(fieldSchema);
            // refresh();
          }}
        >
          Add
        </Button>
        <Button
          onClick={() => {
            fieldSchema.parent.removeProperty(fieldSchema.name);
            setFieldSchema(fieldSchema);
          }}
        >
          Remove
        </Button>
      </Space>
      <br />
      <br />
      {props.children}
    </div>
  );
});

const SchemaField = createSchemaField({
  components: {
    Hello,
  },
  scope: {},
});

export default observer(() => {
  const [, refresh] = useState(uid());
  const form = useMemo(() => createForm({ designable: false }), []);

  const schema = useMemo(
    () =>
      new Schema({
        type: 'object',
        properties: {
          hello0: {
            type: 'void',
            'x-component': 'Hello',
            'x-component-props': {
              name: 'World',
            },
            properties: {
              hello: {
                type: 'void',
                'x-component': 'Hello',
                'x-component-props': {
                  name: 'World',
                },
              },
            },
          },
          hello1: {
            type: 'void',
            'x-component': 'Hello',
            'x-component-props': {
              name: 'World',
            },
            properties: {
              hello: {
                type: 'void',
                'x-component': 'Hello',
                'x-component-props': {
                  name: 'World',
                },
              },
            },
          },
        },
      }),
    [],
  );
  return (
    <Form form={form} layout="vertical">
      <DesignableContext.Provider
        value={{
          refresh: () => {
            refresh(uid());
          },
        }}
      >
        <SchemaField schema={schema} />
      </DesignableContext.Provider>
    </Form>
  );
});
