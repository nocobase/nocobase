import React, { useState } from 'react';
import {
  observer,
  connect,
  useField,
  RecursionField,
  ISchema,
  Schema,
  useFieldSchema,
} from '@formily/react';
import { ArrayCollapse } from '@formily/antd';
import { uid } from '@formily/shared';
import '@formily/antd/lib/form-tab/style';
import { Collapse, Button } from 'antd';

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

const interfaces = new Map<string, ISchema>();

interfaces.set('string', {
  type: 'object',
  default: {
    type: 'string',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Input',
    } as ISchema,
  },
  properties: {
    type: {
      type: 'string',
      title: '数据类型',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'String', value: 'string' },
        { label: 'Text', value: 'text' },
      ],
    },
    name: {
      type: 'string',
      title: '字段标识',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    'ui.title': {
      type: 'string',
      title: '字段名称',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
});

interfaces.set('textarea', {
  type: 'object',
  default: {
    type: 'text',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Input.TextArea',
    } as ISchema,
  },
  properties: {
    type: {
      type: 'string',
      title: '数据类型',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'String', value: 'string' },
        { label: 'Text', value: 'text' },
      ],
    },
    name: {
      type: 'string',
      required: true,
      title: '字段标识',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    'ui.title': {
      type: 'string',
      required: true,
      title: '字段名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
});

export const DatabaseField: any = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  console.log('DatabaseField', field.componentProps);
  return (
    <div>
      <Collapse
        // activeKey={field.componentProps.activeKey}
        {...props}
        onChange={(key) => {
          field.setComponentProps({
            activeKey: key,
          });
        }}
        accordion
      >
        {field.value?.map((item, index) => {
          const schema = interfaces.get(item.interface);
          console.log({ schema });
          return (
            <Collapse.Panel
              extra={[
                <Button onClick={() => field.moveUp(index)}>Up</Button>,
                <Button
                  onClick={() => {
                    field.remove(index);
                    field.insert(index, {
                      ...item,
                      interface: 'textarea',
                    });
                  }}
                >
                  Update
                </Button>,
              ]}
              header={item.name}
              key={item.id}
            >
              <RecursionField
                key={`${item.id}_${index}`}
                name={index}
                schema={new Schema(schema)}
              />
            </Collapse.Panel>
          );
        })}
      </Collapse>
      <Button
        block
        type={'dashed'}
        style={{ marginTop: 10 }}
        onClick={() => {
          field.push({
            id: uid(),
            type: 'string',
            interface: 'string',
            name: uid(),
          });
          console.log('field.value', field.value);
        }}
      >
        新增
      </Button>
    </div>
  );
});
