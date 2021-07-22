import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import {
  connect,
  observer,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
  RecursionField,
  Schema,
  ISchema,
  useForm,
} from '@formily/react';
import {
  Menu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
  DividerProps,
  Dropdown,
  Modal,
  Button,
  Spin,
  Switch,
  Checkbox,
} from 'antd';
import {
  MenuOutlined,
  GroupOutlined,
  PlusOutlined,
  LinkOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
  DownOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import {
  createCollectionField,
  createOrUpdateCollection,
  createSchema,
  request,
  useCollectionContext,
  useDesignable,
  useSchemaPath,
} from '../';
import { uid } from '@formily/shared';
import { useRequest } from 'ahooks';
import { SchemaField } from '../../components/schema-renderer';
import { useResourceContext } from '../';
import { cloneDeep } from 'lodash';
import { options } from '../database-field/interfaces';
import { useDisplayFieldsContext } from '../form';

const generateGridBlock = (schema: ISchema) => {
  const name = schema.name || uid();
  return {
    type: 'void',
    name: uid(),
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [name]: schema,
        },
      },
    },
  };
};

const isGrid = (schema: Schema) => {
  return schema['x-component'] === 'Grid';
};

const isGridBlock = (schema: Schema) => {
  if (schema.parent['x-component'] !== 'Grid.Col') {
    return false;
  }
  // Grid.Col 里有多少 Block
  if (Object.keys(schema.parent.properties).length > 1) {
    return false;
  }
  // 有多少 Grid.Row
  if (Object.keys(schema.parent.parent.properties).length > 1) {
    return false;
  }
  return true;
};

function generateCardItemSchema(component) {
  const defaults = {
    Markdown: {
      type: 'string',
      default: '这是一段演示文字',
      'x-designable-bar': 'Markdown.DesignableBar',
      'x-decorator': 'CardItem',
      'x-read-pretty': true,
      'x-component': 'Markdown',
      'x-component-props': {
        savedInSchema: true,
      },
    },
    Table: {
      type: 'array',
      'x-designable-bar': 'Table.DesignableBar',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
      default: [
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
        { key: uid(), field1: uid(), field2: uid() },
      ],
      'x-component-props': {
        rowKey: 'key',
        dragSort: true,
        showIndex: true,
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Table.ActionBar',
          'x-designable-bar': 'Table.ActionBar.DesignableBar',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Table.Filter',
              'x-designable-bar': 'Table.Filter.DesignableBar',
              'x-component-props': {
                fieldNames: [],
              },
            },
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: '新增',
              'x-component': 'Action',
              'x-designable-bar': 'Table.Action.DesignableBar',
              properties: {
                modal: {
                  type: 'void',
                  title: '新增数据',
                  'x-decorator': 'Form',
                  'x-component': 'Action.Modal',
                  'x-component-props': {
                    useOkAction: '{{ Table.useTableCreateAction }}',
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                    },
                  },
                },
              },
            },
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: '删除',
              'x-component': 'Action',
              'x-designable-bar': 'Table.Action.DesignableBar',
              'x-component-props': {
                useAction: '{{ Table.useTableDestroyAction }}',
              },
            },
          },
        },
        [uid()]: {
          type: 'void',
          'x-component': 'Table.ActionBar',
          'x-component-props': {
            align: 'bottom',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Table.Pagination',
              'x-component-props': {},
            },
          },
        },
        [uid()]: {
          type: 'void',
          'x-component': 'Table.Column',
          'x-component-props': {
            className: 'nb-table-operation',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Action.Dropdown',
              'x-component-props': {
                buttonProps: {
                  icon: 'EllipsisOutlined',
                },
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '操作 1',
                  'x-component': 'Menu.Action',
                  'x-component-props': {
                    style: {
                      minWidth: 150,
                    },
                    disabled: true,
                  },
                },
                [uid()]: {
                  type: 'void',
                  name: 'action1',
                  title: '查看',
                  'x-component': 'Menu.Action',
                  'x-designable-bar': 'Table.Action.DesignableBar',
                  properties: {
                    drawer1: {
                      type: 'void',
                      title: '查看',
                      'x-component': 'Action.Modal',
                      'x-component-props': {},
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Tabs',
                          properties: {
                            tab1: {
                              type: 'void',
                              'x-component': 'Tabs.TabPane',
                              'x-component-props': {
                                tab: 'Tab1',
                              },
                              properties: {
                                aaa: {
                                  type: 'string',
                                  title: 'AAA',
                                  'x-decorator': 'FormItem',
                                  required: true,
                                  'x-component': 'Input',
                                },
                              },
                            },
                            tab2: {
                              type: 'void',
                              'x-component': 'Tabs.TabPane',
                              'x-component-props': {
                                tab: 'Tab2',
                              },
                              properties: {
                                bbb: {
                                  type: 'string',
                                  title: 'BBB',
                                  'x-decorator': 'FormItem',
                                  required: true,
                                  'x-component': 'Input',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  name: 'action1',
                  title: '修改',
                  'x-component': 'Menu.Action',
                  'x-designable-bar': 'Table.Action.DesignableBar',
                  properties: {
                    drawer1: {
                      type: 'void',
                      title: '编辑表单',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useValues: '{{ Table.useTableRow }}',
                      },
                      'x-component': 'Action.Modal',
                      'x-component-props': {
                        useOkAction: '{{ Table.useTableUpdateAction }}',
                      },
                      properties: {
                        field1: {
                          type: 'string',
                          title: '字段1',
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                        field2: {
                          type: 'string',
                          title: '字段2',
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                      },
                    },
                  },
                },
                [uid()]: {
                  type: 'void',
                  title: '删除',
                  'x-component': 'Menu.Action',
                  'x-component-props': {
                    useAction: '{{ Table.useTableDestroyAction }}',
                  },
                },
              },
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: '字段1',
          'x-component': 'Table.Column',
          'x-component-props': {
            // title: 'z1',
          },
          'x-designable-bar': 'Table.Column.DesignableBar',
          properties: {
            field1: {
              type: 'string',
              required: true,
              'x-read-pretty': true,
              'x-decorator-props': {
                feedbackLayout: 'popover',
              },
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: '字段2',
          'x-component': 'Table.Column',
          'x-component-props': {
            // title: 'z1',
          },
          'x-designable-bar': 'Table.Column.DesignableBar',
          properties: {
            field2: {
              type: 'string',
              required: true,
              'x-read-pretty': true,
              'x-decorator-props': {
                feedbackLayout: 'popover',
              },
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
    Form: {
      type: 'void',
      name: uid(),
      'x-decorator': 'CardItem',
      'x-component': 'Form',
      'x-component-props': {
        showDefaultButtons: true,
      },
      'x-designable-bar': 'Form.DesignableBar',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Grid',
          'x-component-props': {
            addNewComponent: 'AddNew.FormItem',
          },
        },
      },
    },
  };
  return defaults[component];
}

function generateFormItemSchema(component) {
  const defaults = {
    Markdown: {
      type: 'string',
      title: uid(),
      'x-designable-bar': 'Markdown.DesignableBar',
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-component-props': {},
    },
  };
  return defaults[component];
}

const dbSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      title: '数据表名称',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '数据表标识',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-read-pretty': true,
    },
    fields: {
      type: 'array',
      title: '数据表字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
      default: [],
    },
  },
};

export const AddNew = () => null;

AddNew.CardItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  // const {
  //   data: collections = [],
  //   loading,
  //   run,
  // } = useRequest('collections:findAll', {
  //   formatResult: (result) => result?.data,
  // });
  const { data: collections = [], loading, refresh } = useCollectionContext();
  console.log({ collections });
  return (
    <Dropdown
      trigger={['click']}
      overlayStyle={{
        minWidth: 200,
      }}
      onVisibleChange={(visible) => {
        console.log('onVisibleChange', visible);
      }}
      placement={'bottomCenter'}
      overlay={
        <Menu
          onClick={async (info) => {
            let data: ISchema;
            let resourceName = null;
            if (['addNewTable', 'addNewForm'].includes(info.key)) {
              const values = await FormDialog(`新建数据表`, () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField schema={dbSchema} />
                  </FormLayout>
                );
              }).open({
                initialValues: {
                  name: `t_${uid()}`,
                  fields: [],
                },
              });
              await createOrUpdateCollection(values);
              refresh();
              data = generateCardItemSchema(
                info.key === 'addNewTable' ? 'Table' : 'Form',
              );
              resourceName = values.name;
            } else if (info.key !== 'Markdown') {
              const keys = info.key.split('.');
              const component = keys.shift();
              const tableName = keys.join('.');
              resourceName = tableName;
              data = generateCardItemSchema(component);
              console.log('info.keyPath', component, tableName);
            } else {
              data = generateCardItemSchema(info.key);
            }
            if (schema['key']) {
              data['key'] = uid();
            }
            if (resourceName) {
              data['x-component-props'] = data['x-component-props'] || {};
              data['x-component-props']['resourceName'] = resourceName;
            }
            if (isGridBlock(schema)) {
              path.pop();
              path.pop();
              data = generateGridBlock(data);
            } else if (isGrid(schema)) {
              data = generateGridBlock(data);
            }
            if (data) {
              let s;
              if (isGrid(schema)) {
                s = appendChild(data, [...path]);
              } else if (defaultAction === 'insertAfter') {
                s = insertAfter(data, [...path]);
              } else {
                s = insertBefore(data, [...path]);
              }
              await createSchema(s);
            }
          }}
        >
          <Menu.SubMenu key={'Table'} title={'新建表格'}>
            <Menu.ItemGroup key={'table-select'} title={'选择数据表'}>
              {collections.map((item) => (
                <Menu.Item key={`Table.${item.name}`}>{item.title}</Menu.Item>
              ))}
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item key={'addNewTable'}>新建数据表</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu key={'Form'} title={'新建表单'}>
            <Menu.ItemGroup key={'form-select'} title={'选择数据表'}>
              {collections.map((item) => (
                <Menu.Item key={`Form.${item.name}`}>{item.title}</Menu.Item>
              ))}
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item key={'addNewForm'}>新建数据表</Menu.Item>
          </Menu.SubMenu>
          <Menu.Item key={'Markdown'}>新建文本段</Menu.Item>
          <Menu.SubMenu disabled key={'Ref'} title={'引用模板'}>
            <Menu.ItemGroup key={'form-select'} title={'选择模板'}>
              <Menu.Item key={'Ref.name1'}>模板1</Menu.Item>
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item key={'addNewRef'}>新建模板</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
      )}
    </Dropdown>
  );
});

AddNew.BlockItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter } = useDesignable();
  const path = useSchemaPath();
  return (
    <Dropdown
      overlayStyle={{
        minWidth: 200,
      }}
      placement={'bottomCenter'}
      overlay={
        <Menu>
          <Menu.SubMenu title={'新建表格'}>
            <Menu.ItemGroup title={'选择数据表'}>
              <Menu.Item>数据表1</Menu.Item>
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item>新增数据表</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu title={'新建表单'}>
            <Menu.ItemGroup title={'选择数据表'}>
              <Menu.Item>数据表1</Menu.Item>
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item>新增数据表</Menu.Item>
          </Menu.SubMenu>
          <Menu.Item
            onClick={async () => {
              let data: ISchema = {
                type: 'void',
                title: uid(),
                'x-designable-bar': 'BlockItem.DesignableBar',
                'x-decorator': 'CardItem',
                'x-component': 'Markdown',
              };
              if (schema['key']) {
                data['key'] = uid();
              }
              console.log('isGridBlock(schema)', isGridBlock(schema));
              if (isGridBlock(schema)) {
                path.pop();
                path.pop();
                data = generateGridBlock(data);
              }
              if (data) {
                let s;
                if (defaultAction === 'insertAfter') {
                  s = insertAfter(data, [...path]);
                } else {
                  s = insertBefore(data, [...path]);
                }
                await createSchema(s);
              }
            }}
          >
            新建 Markdown
          </Menu.Item>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
      )}
    </Dropdown>
  );
});

function FieldSwitch({ field, onChange, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  const form = useForm();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onClick={(e) => {
        setChecked((value) => {
          onChange && onChange(!value);
          return !value;
        });
        console.log('FieldSwitch', form);
      }}
    >
      <span>{field?.uiSchema?.title || '未命名'}</span>
      <Switch
        onChange={(checked, e) => {
          e.stopPropagation();
          setChecked(checked);
          onChange && onChange(checked);
        }}
        size={'small'}
        checked={checked}
      />
    </div>
  );
}

AddNew.FormItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const { resource = {}, refresh } = useResourceContext();
  const [visible, setVisible] = useState(false);
  const { displayFields = [] } = useDisplayFieldsContext();
  console.log({ displayFields });
  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      placement={'bottomCenter'}
      overlay={
        <Menu>
          <Menu.ItemGroup title={`要展示的字段`}>
            {resource?.fields?.map((field) => (
              <Menu.Item key={field.key}>
                <FieldSwitch
                  field={field}
                  defaultChecked={displayFields.includes(field.name)}
                  onChange={async (checked) => {
                    if (!checked) {
                      return;
                    }
                    let data: ISchema = {
                      key: uid(),
                      type: 'void',
                      'x-decorator': 'Form.Field.Item',
                      'x-designable-bar': 'Form.Field.DesignableBar',
                      'x-component': 'Form.Field',
                      'x-component-props': {
                        fieldName: field.name,
                      },
                    };
                    if (isGridBlock(schema)) {
                      path.pop();
                      path.pop();
                      data = generateGridBlock(data);
                    } else if (isGrid(schema)) {
                      data = generateGridBlock(data);
                    }
                    if (data) {
                      let s;
                      if (isGrid(schema)) {
                        s = appendChild(data, [...path]);
                      } else if (defaultAction === 'insertAfter') {
                        s = insertAfter(data, [...path]);
                      } else {
                        s = insertBefore(data, [...path]);
                      }
                      await createSchema(s);
                    }
                  }}
                />
              </Menu.Item>
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu title={'新建字段'}>
            {options.map((option) => (
              <Menu.ItemGroup title={option.label}>
                {option.children.map((item) => (
                  <Menu.Item
                    style={{ minWidth: 150 }}
                    key={item.name}
                    onClick={async () => {
                      setVisible(false);
                      const values = await FormDialog(`新增字段`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField schema={item} />
                          </FormLayout>
                        );
                      }).open({
                        initialValues: {
                          ...item.default,
                          key: uid(),
                          name: `f_${uid()}`,
                        },
                      });
                      await createCollectionField(resource.name, values);
                      await refresh();
                      let data: ISchema = cloneDeep(values.uiSchema);
                      data['name'] = values.name;
                      data['referenceKey'] = data['key'];
                      data['key'] = uid();
                      if (isGridBlock(schema)) {
                        path.pop();
                        path.pop();
                        data = generateGridBlock(data);
                      } else if (isGrid(schema)) {
                        data = generateGridBlock(data);
                      }
                      if (data) {
                        let s;
                        if (isGrid(schema)) {
                          s = appendChild(data, [...path]);
                        } else if (defaultAction === 'insertAfter') {
                          s = insertAfter(data, [...path]);
                        } else {
                          s = insertBefore(data, [...path]);
                        }
                        await createSchema(s);
                      }
                    }}
                  >
                    {item.title}
                  </Menu.Item>
                ))}
              </Menu.ItemGroup>
            ))}
          </Menu.SubMenu>
          {/* <Menu.Divider /> */}
          <Menu.Item
            onClick={async () => {
              let data: ISchema = {
                key: uid(),
                type: 'string',
                default: '这是一段演示文字，**支持使用 Markdown 语法**',
                'x-designable-bar': 'Markdown.FormItemDesignableBar',
                'x-decorator': 'FormItem',
                'x-read-pretty': true,
                'x-component': 'Markdown',
                'x-component-props': {
                  savedInSchema: true,
                },
              };
              if (isGridBlock(schema)) {
                path.pop();
                path.pop();
                data = generateGridBlock(data);
              } else if (isGrid(schema)) {
                data = generateGridBlock(data);
              }
              if (data) {
                let s;
                if (isGrid(schema)) {
                  s = appendChild(data, [...path]);
                } else if (defaultAction === 'insertAfter') {
                  s = insertAfter(data, [...path]);
                } else {
                  s = insertBefore(data, [...path]);
                }
                await createSchema(s);
              }
              setVisible(false);
            }}
          >
            添加说明文字
          </Menu.Item>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
      )}
    </Dropdown>
  );
});

export default AddNew;
