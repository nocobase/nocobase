import { FormItem, Input } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema, useForm } from '@formily/react';
import { Action, Form, SchemaComponent, SchemaComponentProvider, useActionContext } from '@nocobase/client';
import { Select } from 'antd';
import React, { useRef } from 'react';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

const Editable = observer((props) => {
  const field = useField<Field>();
  const schema = useFieldSchema();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        打开方式：
        <Select
          value={field.componentProps.openMode}
          style={{ width: 100 }}
          onChange={(value) => {
            field.componentProps.openMode = value;
            schema['x-component-props']['openMode'] = value;
          }}
        >
          <Select.Option value={'drawer'}>Drawer</Select.Option>
          <Select.Option value={'modal'}>Modal</Select.Option>
          <Select.Option value={'page'}>Page</Select.Option>
        </Select>
      </div>
      {props.children}
    </div>
  );
});

const schema: ISchema = {
  type: 'object',
  properties: {
    action1: {
      'x-decorator': 'Editable',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        openMode: 'modal',
        containerRefKey: 'containerRef',
      },
      type: 'void',
      title: 'Open',
      properties: {
        drawer1: {
          'x-component': 'Action.Container',
          'x-component-props': {},
          type: 'void',
          title: 'Modal Title',
          properties: {
            hello1: {
              title: 'T1',
              'x-content': 'Hello',
            },
            footer1: {
              'x-component': 'Action.Container.Footer',
              type: 'void',
              properties: {
                close1: {
                  title: 'Close',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCloseAction }}',
                  },
                },
                submit: {
                  title: 'Submit',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    useAction: '{{ useCloseAction }}',
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

export default observer(() => {
  const containerRef = useRef();
  return (
    <SchemaComponentProvider
      scope={{ containerRef, useCloseAction }}
      components={{ Editable, Form, Action, Input, FormItem }}
    >
      <SchemaComponent schema={schema} />
      <div ref={containerRef}></div>
    </SchemaComponentProvider>
  );
});
