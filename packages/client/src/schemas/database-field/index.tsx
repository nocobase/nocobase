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
import { Collapse, Button, Dropdown, Menu } from 'antd';

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
    'ui.title': {
      type: 'string',
      title: '字段名称',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '字段标识',
      required: true,
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
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
    'ui.title': {
      type: 'string',
      required: true,
      title: '字段名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      required: true,
      title: '字段标识',
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
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
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
});

interfaces.set('subTable', {
  type: 'object',
  default: {
    type: 'string',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Select',
      enum: [],
    } as ISchema,
  },
  properties: {
    'ui.title': {
      type: 'string',
      required: true,
      title: '字段名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      required: true,
      title: '字段标识',
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    type: {
      type: 'string',
      title: '数据类型',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'String', value: 'string' },
        { label: 'Text', value: 'text' },
        { label: 'HasMany', value: 'hasMany' },
      ],
    },
    'children': {
      type: 'array',
      title: '子表格字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
    },
    // 'ui.required': {
    //   type: 'string',
    //   title: '必填',
    //   'x-decorator': 'FormItem',
    //   'x-component': 'Checkbox',
    // },
  },
});

interfaces.set('select', {
  type: 'object',
  default: {
    type: 'string',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Select',
      enum: [],
    } as ISchema,
  },
  properties: {
    'ui.title': {
      type: 'string',
      required: true,
      title: '字段名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      required: true,
      title: '字段标识',
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
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
    'ui.enum': {
      type: 'array',
      title: '可选项',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      'x-component-props': {
        pagination: false,
        // scroll: { x: '100%' },
      },
      items: {
        type: 'object',
        properties: {
          column1: {
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
          column2: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '选项值' },
            properties: {
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          column3: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '选项' },
            properties: {
              label: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          column4: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '颜色' },
            properties: {
              color: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'ColorSelect',
              },
            },
          },
          column5: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: '',
              dataIndex: 'operations',
              fixed: 'right',
            },
            properties: {
              item: {
                type: 'void',
                'x-component': 'FormItem',
                properties: {
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayTable.Remove',
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
          'x-component': 'ArrayTable.Addition',
          title: '添加可选项',
        },
      },
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
  const [activeKey, setActiveKey] = useState(null);
  return (
    <div>
      <Collapse activeKey={activeKey} onChange={(key) => {
        setActiveKey(key);
      }} accordion>
        {field.value?.map((item, index) => {
          const schema = interfaces.get(item.interface);
          console.log({ schema });
          return (
            <Collapse.Panel
              // extra={[
              //   <Button onClick={() => field.moveUp(index)}>Up</Button>,
              //   <Button
              //     onClick={() => {
              //       field.remove(index);
              //       field.insert(index, {
              //         ...item,
              //         interface: 'textarea',
              //       });
              //     }}
              //   >
              //     Update
              //   </Button>,
              // ]}
              header={
                <>
                  {item.ui && item.ui.title}
                  {' '}
                  {item.name}
                </>
              }
              key={item.id}
            >
              <RecursionField
                key={`${item.id}_${index}`}
                name={index}
                schema={new Schema({
                  type: 'object',
                  properties: {
                    layout: {
                      type: 'void',
                      'x-component': 'FormLayout',
                      'x-component-props': {
                        layout: 'vertical',
                        // labelCol: 4,
                        // wrapperCol: 20,
                      },
                      properties: schema.properties,
                    },
                  },
                })}
              />
            </Collapse.Panel>
          );
        })}
      </Collapse>
      <Dropdown
        placement={'bottomCenter'}
        overlayStyle={{
          minWidth: 200,
        }}
        overlay={
          <Menu
            onClick={info => {
              const schema = interfaces.get(info.key);
              if (!schema) {
                return;
              }
              const data = {
                id: uid(),
                name: uid(),
                interface: info.key,
                ...schema.default
              };
              field.push(data);
              setActiveKey(data.id);
              console.log('info.key', info.key, schema);
            }}
          >
            <Menu.Item key={'string'}>单行文本</Menu.Item>
            <Menu.Item key={'textarea'}>多行文本</Menu.Item>
            <Menu.Item key={'select'}>下拉选择</Menu.Item>
            <Menu.Item key={'subTable'}>子表格</Menu.Item>
          </Menu>
        }
      >
        <Button
          block
          type={'dashed'}
          style={{ marginTop: 10 }}
        >
          新增
        </Button>
      </Dropdown>
    </div>
  );
});
