import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import { Action, SchemaComponent, SchemaComponentProvider, useActionContext } from '@nocobase/client';
import { Radio } from 'antd';
import React, { useRef } from 'react';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const Editable = observer(
  (props) => {
    const field = useField<Field>();
    const schema = useFieldSchema();
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          打开方式：
          <Radio.Group
            value={field.componentProps.openMode}
            onChange={(e) => {
              field.componentProps.openMode = e.target.value;
              schema['x-component-props']['openMode'] = e.target.value;
            }}
          >
            <Radio.Button value="drawer">Drawer</Radio.Button>
            <Radio.Button value="modal">Modal</Radio.Button>
            <Radio.Button value="page">Page</Radio.Button>
          </Radio.Group>
        </div>
        {props.children}
      </div>
    );
  },
  { displayName: 'Editable' },
);

const schema: ISchema = {
  type: 'object',
  properties: {
    action1: {
      type: 'void',
      title: 'Open',
      'x-decorator': 'Editable',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        openMode: 'modal',
        containerRefKey: 'containerRef',
      },
      properties: {
        drawer1: {
          type: 'void',
          title: 'Modal Title',
          'x-component': 'Action.Container',
          'x-component-props': {},
          properties: {
            hello1: {
              title: 'T1',
              'x-content': 'Hello',
            },
            footer1: {
              type: 'void',
              'x-component': 'Action.Container.Footer',
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
  const containerRef = useRef(null);
  return (
    <SchemaComponentProvider scope={{ useCloseAction, containerRef }} components={{ Editable, Action }}>
      <SchemaComponent schema={schema} />
      <div ref={containerRef}></div>
    </SchemaComponentProvider>
  );
});
