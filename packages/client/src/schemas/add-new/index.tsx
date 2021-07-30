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
  removeSchema,
  useDesignable,
  useSchemaPath,
} from '../';
import { uid } from '@formily/shared';
import { getSchemaPath, SchemaField } from '../../components/schema-renderer';
import { cloneDeep } from 'lodash';
import { options } from '../database-field/interfaces';

import './style.less';
import IconPicker from '../../components/icon-picker';
import { barChartConfig, columnChartConfig } from './chart';
import { isGridRowOrCol } from '../grid';
import {
  useCollectionContext,
  useCollectionsContext,
  useDisplayedMapContext,
} from '../../constate';

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
    'Markdown.Void': {
      type: 'void',
      default: '这是一段演示文字，**支持使用 Markdown 语法**',
      'x-designable-bar': 'Markdown.Void.DesignableBar',
      'x-decorator': 'CardItem',
      'x-read-pretty': true,
      'x-component': 'Markdown.Void',
    },
    Table: {
      type: 'array',
      'x-designable-bar': 'Table.DesignableBar',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
      default: [
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
      ],
      'x-component-props': {
        rowKey: 'id',
        dragSort: true,
        showIndex: true,
        refreshRequestOnChange: true,
        pagination: {
          pageSize: 10,
        },
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
          title: '操作',
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
                    [uid()]: {
                      type: 'void',
                      title: '查看',
                      'x-component': 'Action.Modal',
                      'x-component-props': {
                        bodyStyle: {
                          background: '#f0f2f5',
                          paddingTop: 0,
                        },
                      },
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Tabs',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              'x-component': 'Tabs.TabPane',
                              'x-component-props': {
                                tab: 'Tab1',
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Grid',
                                  'x-component-props': {
                                    addNewComponent: 'AddNew.PaneItem',
                                  },
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
                  title: '编辑',
                  'x-component': 'Menu.Action',
                  'x-designable-bar': 'Table.Action.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: '编辑数据',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useResource: '{{ Table.useResource }}',
                        useValues: '{{ Table.useTableRowRecord }}',
                      },
                      'x-component': 'Action.Modal',
                      'x-component-props': {
                        useOkAction: '{{ Table.useTableUpdateAction }}',
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
    'Chart.Column': {
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Chart.Column',
      'x-designable-bar': 'Chart.DesignableBar',
      'x-component-props': {
        config: cloneDeep(columnChartConfig),
      },
    },
    'Chart.Bar': {
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Chart.Bar',
      'x-designable-bar': 'Chart.DesignableBar',
      'x-component-props': {
        config: cloneDeep(barChartConfig),
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
  const { collections = [], loading, refresh } = useCollectionsContext();
  return (
    <Dropdown
      trigger={['click']}
      overlayStyle={{
        minWidth: 200,
      }}
      onVisibleChange={(visible) => {
        console.log('onVisibleChange', visible);
      }}
      overlay={
        <Menu
          onClick={async (info) => {
            let data: ISchema;
            let collectionName = null;
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
              collectionName = values.name;
            } else if (info.key.startsWith('collection.')) {
              const keys = info.key.split('.');
              const component = keys.pop();
              const tableName = keys.pop();
              collectionName = tableName;
              data = generateCardItemSchema(component);
              console.log('info.keyPath', component, tableName);
            } else {
              data = generateCardItemSchema(info.key);
              console.log('generateCardItemSchema', data, info.key);
            }
            if (schema['key']) {
              data['key'] = uid();
            }
            if (collectionName) {
              data['x-component-props'] = data['x-component-props'] || {};
              data['x-component-props']['resource'] = collectionName;
              data['x-component-props']['collectionName'] = collectionName;
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
          <Menu.ItemGroup title={'数据区块'}>
            {[
              { key: 'Table', title: '表格', icon: 'TableOutlined' },
              { key: 'Form', title: '表单', icon: 'FormOutlined' },
              {
                key: 'Calendar',
                title: '日历',
                icon: 'CalendarOutlined',
                disabled: true,
              },
              {
                key: 'Kanban',
                title: '看板',
                icon: 'CreditCardOutlined',
                disabled: true,
              },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup key={`${view.key}-select`} title={'所属数据表'}>
                  {collections?.map((item) => (
                    <Menu.Item
                      style={{ minWidth: 150 }}
                      key={`collection.${item.name}.${view.key}`}
                    >
                      {item.title}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider></Menu.Divider>
                <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  新建数据表
                </Menu.Item>
              </Menu.SubMenu>
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={'多媒体区块'}>
            <Menu.Item
              key={'Markdown.Void'}
              icon={<IconPicker type={'FileMarkdownOutlined'} />}
            >
              Markdown
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Wysiwyg.Void'}
              icon={<IconPicker type={'FileTextOutlined'} />}
            >
              富文本
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={'图表区块'}>
            <Menu.Item
              key={'Chart.Column'}
              icon={<IconPicker type={'BarChartOutlined'} />}
            >
              柱状图
            </Menu.Item>
            <Menu.Item
              key={'Chart.Bar'}
              icon={<IconPicker type={'BarChartOutlined'} />}
            >
              条形图
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Chart.Line'}
              icon={<IconPicker type={'LineChartOutlined'} />}
            >
              折线图
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Chart.Pie'}
              icon={<IconPicker type={'PieChartOutlined'} />}
            >
              饼图
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
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
        <Button type={'dashed'} icon={<PlusOutlined />}>
          新增区块
        </Button>
      )}
    </Dropdown>
  );
});

function SwitchField(props) {
  const { field, onChange } = props;
  const [checked, setChecked] = useState(props.checked);
  useEffect(() => {
    setChecked(props.checked);
  }, [props.checked]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onClick={async () => {
        setChecked((checked) => {
          onChange(!checked);
          return !checked;
        });
      }}
    >
      <span>{field.uiSchema.title}</span>
      <Switch checked={checked} size={'small'} />
    </div>
  );
}

AddNew.FormItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild, deepRemove } =
    useDesignable();
  const path = useSchemaPath();
  const { collection, fields, refresh } = useCollectionContext();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={`字段展示`}>
            {fields?.map((field) => (
              <Menu.Item key={field.key}>
                <SwitchField
                  field={field}
                  checked={displayed.has(field.name)}
                  onChange={async (checked) => {
                    if (!checked) {
                      const s: any = displayed.get(field.name);
                      const p = getSchemaPath(s);
                      const removed = deepRemove(p);
                      if (!removed) {
                        console.log('getSchemaPath', p, removed);
                        return;
                      }
                      const last = removed.pop();
                      displayed.remove(field.name);
                      if (isGridRowOrCol(last)) {
                        await removeSchema(last);
                      }
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
          <Menu.SubMenu
            popupClassName={'add-new-fields-popup'}
            className={'sub-menu-add-new-fields'}
            title={'新建字段'}
          >
            {options.map(
              (option) =>
                option.children.length > 0 && (
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
                              interface: item.name,
                              ...item.default,
                              key: uid(),
                              name: `f_${uid()}`,
                            },
                          });
                          await createCollectionField(collection?.name, values);
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
                ),
            )}
          </Menu.SubMenu>
          {/* <Menu.Divider /> */}
          <Menu.Item
            onClick={async () => {
              let data: ISchema = {
                type: 'void',
                default: '这是一段演示文字，**支持使用 Markdown 语法**',
                'x-designable-bar': 'Markdown.Void.DesignableBar',
                'x-decorator': 'FormItem',
                'x-read-pretty': true,
                'x-component': 'Markdown.Void',
              };
              if (schema['key']) {
                data['key'] = uid();
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
                console.log('ISchema', schema, data, path);
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
        <Button type={'dashed'} icon={<PlusOutlined />}>
          配置字段
        </Button>
      )}
    </Dropdown>
  );
});

AddNew.PaneItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const [visible, setVisible] = useState(false);

  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      // placement={'bottomCenter'}
      overlay={
        <Menu>
          <Menu.ItemGroup title={'数据区块'}>
            <Menu.Item
              icon={<IconPicker type={'FileOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-read-pretty': true,
                  'x-component-props': {
                    useResource: '{{ Table.useResource }}',
                    useValues: '{{ Table.useTableRowRecord }}',
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
              style={{ minWidth: 150 }}
            >
              详情
            </Menu.Item>
            <Menu.Item
              icon={<IconPicker type={'FormOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-component-props': {
                    useResource: '{{ Table.useResource }}',
                    useValues: '{{ Table.useTableRowRecord }}',
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
              表单
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup title={'相关数据区块'}>
            <Menu.Item
              style={{ minWidth: 150 }}
              icon={<IconPicker type={'HistoryOutlined'} />}
            >
              日志
            </Menu.Item>
            <Menu.Item icon={<IconPicker type={'CommentOutlined'} />}>
              评论
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup title={'多媒体区块'}>
            <Menu.Item
              icon={<IconPicker type={'FileMarkdownOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  key: uid(),
                  type: 'void',
                  default: '这是一段演示文字，**支持使用 Markdown 语法**',
                  'x-designable-bar': 'Markdown.Void.DesignableBar',
                  'x-decorator': 'CardItem',
                  'x-read-pretty': true,
                  'x-component': 'Markdown.Void',
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
              Markdown
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button block type={'dashed'} icon={<PlusOutlined />}>
          新增区块
        </Button>
      )}
    </Dropdown>
  );
});

export default AddNew;
