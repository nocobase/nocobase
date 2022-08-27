import {
  ArrayTable,
  Editable,
  Form,
  FormButtonGroup,
  FormDrawer,
  FormItem,
  FormLayout,
  Input,
  NumberPicker,
  Select,
  Submit
} from '@formily/antd';
import { createForm, Field } from '@formily/core';
import { connect, createSchemaField, observer, useField } from '@formily/react';
import React from 'react';

const ViewOptions = connect((props) => {
  return <div>{JSON.stringify(props.value)}</div>;
});

const types = {
  type1: {
    input1: {
      type: 'string',
      title: 'Input11',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    input2: {
      type: 'string',
      title: 'Input11',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
  type2: {
    input1: {
      type: 'string',
      title: 'Input12',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    input2: {
      type: 'string',
      title: 'Input12',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};

const EditOptions = observer((props) => {
  const record = ArrayTable.useRecord();
  const field = useField<Field>();
  console.log(record.type);
  return (
    <div>
      <a
        onClick={() => {
          FormDrawer('Pop-up form', () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
                <SchemaField
                  schema={{
                    type: 'object',
                    properties: record.type ? types[record.type] || {} : {},
                  }}
                />
                <FormDrawer.Footer>
                  <FormButtonGroup align="right">
                    <Submit
                      onSubmit={() => {
                        return new Promise((resolve) => {
                          setTimeout(resolve, 1000);
                        });
                      }}
                    >
                      Submit
                    </Submit>
                  </FormButtonGroup>
                </FormDrawer.Footer>
              </FormLayout>
            );
          })
            .open({
              initialValues: field.value,
            })
            .then((values) => {
              field.value = values;
            });
        }}
      >
        Edit
      </a>
    </div>
  );
});

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Editable,
    Input,
    NumberPicker,
    ArrayTable,
    Select,
    ViewOptions,
    EditOptions,
  },
});

const form = createForm();

const schema = {
  type: 'object',
  properties: {
    projects: {
      type: 'array',
      title: 'Projects',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      items: {
        type: 'object',
        properties: {
          column_33: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: 'Type',
            },
            properties: {
              type: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: [
                  { label: 'Type1', value: 'type1' },
                  { label: 'Type2', value: 'type2' },
                ],
              },
            },
          },
          column_3: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: 'Options',
            },
            properties: {
              options: {
                type: 'object',
                'x-component': 'ViewOptions',
                'x-reactions': {
                  dependencies: ['.type'],
                  when: '{{$deps[0]}}',
                  fulfill: {
                    state: {
                      value: '{{{}}}',
                    },
                  },
                },
              },
            },
          },
          column_6: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: 'Operations',
            },
            properties: {
              item: {
                type: 'void',
                'x-component': 'FormItem',
                properties: {
                  options: {
                    type: 'object',
                    'x-component': 'EditOptions',
                  },
                },
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: 'Add',
          'x-component': 'ArrayTable.Addition',
        },
      },
    },
  },
};

export default () => {
  return (
    <Form form={form} layout="vertical">
      <SchemaField schema={schema} />
      <FormButtonGroup>
        <Submit onSubmit={console.log}>提交</Submit>
      </FormButtonGroup>
    </Form>
  );
};
