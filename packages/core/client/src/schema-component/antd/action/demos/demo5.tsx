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
  Submit,
} from '@formily/antd-v5';
import { Field, createForm, onFieldValueChange } from '@formily/core';
import { connect, createSchemaField, observer, useField, useForm, useFormEffects } from '@formily/react';
import { Select } from 'antd';
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

function TypeSelect(props) {
  const { setValuesIn } = useForm();
  const index = ArrayTable.useIndex();

  useFormEffects(() => {
    onFieldValueChange(`projects.${index}.type`, (field) => {
      setValuesIn(`projects.${index}.options`, {});
    });
  });

  return (
    <Select {...props}>
      {Object.keys(types).map((key) => (
        <Select.Option key={key} value={key}>
          {types[key].title}
        </Select.Option>
      ))}
    </Select>
  );
}

const EditOptions = observer(
  (props) => {
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
                return values;
              })
              .catch((err) => {
                console.error(err);
              });
          }}
        >
          Edit
        </a>
      </div>
    );
  },
  { displayName: 'EditOptions' },
);

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
          sort: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { width: 50, title: '', align: 'center' },
            properties: {
              sort: {
                type: 'void',
                'x-component': 'ArrayTable.SortHandle',
              },
            },
          },
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
                'x-component': TypeSelect,
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
