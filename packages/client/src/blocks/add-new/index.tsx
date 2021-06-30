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

import { uid } from '@formily/shared';
import {
  DesignableSchemaContext,
  RefreshDesignableSchemaContext,
  SchemaField,
} from '../SchemaField';

import { SchemaBlock } from '../';

import table from './table';
import markdown from './markdown';
import form from './form';
import { useRequest } from 'ahooks';

const row = (schema) => {
  const component = schema['x-component'];
  return {
    type: 'void',
    name: `gr_${uid()}`,
    'x-component': 'Grid.Row',
    properties: {
      [`gc_${uid()}`]: {
        type: 'void',
        'x-component': 'Grid.Col',
        'x-component-props': {
          size: 1,
        },
        properties: {
          [`gb_${uid()}`]: {
            type: 'void',
            'x-component': 'Grid.Block',
            properties: {
              [`gbn_${uid()}`]: schema,
            },
          },
        },
      },
    },
  };
};

export function removeProperty(property: Schema) {
  property.parent.removeProperty(property.name);
}

export function addPropertyBefore(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
  });
}

export function addPropertyAfter(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
  });
}

export function useSchemaQuery(segments?: any[]) {
  const context = useContext(DesignableSchemaContext);
  const refresh = useContext(RefreshDesignableSchemaContext);
  const fieldSchema = useFieldSchema();
  const field = useField();

  const getSchemaByPath = (path) => {
    let s: Schema = context;
    const names = [...path];
    // names.shift();
    while (s && names.length) {
      const name = names.shift();
      s = s.properties[name];
    }
    return s;
  };

  const schema = getSchemaByPath(segments || field.address.segments);

  console.log({ context, schema });

  return {
    refresh,
    schema,
    appendChild(data) {
      schema.addProperty(data.name, data);
      refresh();
    },
    insertAfter(data) {
      addPropertyAfter(schema, data);
      refresh();
    },
    insertBefore(data) {
      addPropertyBefore(schema, data);
      refresh();
    },
    push(data) {
      addPropertyBefore(schema, data);
    },
    remove() {
      removeProperty(schema);
      refresh();
    },
  };
}

export const AddNew: any = observer((props) => {
  const field = useField();

  const segments = [...field.address.segments];
  segments.pop();
  segments.pop();
  segments.pop();
  // segments.pop();

  const { insertBefore, refresh, schema } = useSchemaQuery(segments);
  console.log('field.address.segments', segments, schema);

  const {
    data = [],
    loading,
    mutate,
  } = useRequest(() => {
    return Promise.resolve([
      { title: '数据表1' },
      { title: '数据表2' },
      { title: '数据表3' },
    ]);
  });

  const [visible, setVisible] = useState(false);

  const dbschema = {
    type: 'object',
    properties: {
      layout: {
        type: 'void',
        'x-component': 'FormLayout',
        'x-component-props': {
          layout: 'vertical',
        },
        properties: {
          input: {
            type: 'string',
            title: '数据表名称',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          array: {
            type: 'array',
            title: '数据表字段',
            'x-component': 'ArrayCollapse',
            'x-component-props': {
              accordion: true,
            },
            // maxItems: 3,
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                header: '字段',
              },
              properties: {
                index: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Index',
                },
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  title: 'Input',
                  required: true,
                  'x-component': 'Input',
                },
                remove: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Remove',
                },
                moveUp: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveUp',
                },
                moveDown: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveDown',
                },
              },
            },
            properties: {
              addition: {
                type: 'void',
                title: '添加字段',
                'x-component': 'ArrayCollapse.Addition',
              },
            },
          },
        },
      },
    },
  };

  if (loading) {
    return <Spin />;
  }

  console.log({ data });

  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.SubMenu
            key={`table-tables`}
            style={{ minWidth: 150 }}
            title={'新建表单'}
          >
            <Menu.ItemGroup key={`table-tables-itemgroup`} title={'所属数据表'}>
              {data.map((item, index) => {
                return (
                  <Menu.Item
                    key={`table-${index}`}
                    style={{ minWidth: 150 }}
                    onClick={() => {
                      const rowData = row(form());
                      insertBefore(rowData);
                    }}
                  >
                    {item.title}
                  </Menu.Item>
                );
              })}
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item
              style={{ minWidth: 150 }}
              onClick={() => {
                FormDialog('新建数据表', () => {
                  return <SchemaField schema={dbschema} />;
                })
                  .open({
                    initialValues: {
                      // aaa: '123',
                    },
                  })
                  .then(() => {
                    const items = [...data];
                    items.push({ title: '数据表5' });
                    mutate(items);
                    const rowData = row(form());
                    insertBefore(rowData);
                  });
                // const rowData = row(table());
                // insertBefore(rowData);
              }}
            >
              新增数据表
            </Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu
            key={`form-tables`}
            style={{ minWidth: 150 }}
            title={'新建表格'}
          >
            <Menu.ItemGroup key={`form-tables-itemgroup`} title={'所属数据表'}>
              {data.map((item, index) => {
                return (
                  <Menu.Item
                    key={`form-${index}`}
                    style={{ minWidth: 150 }}
                    onClick={() => {
                      const rowData = row(table());
                      console.log({ rowData });
                      insertBefore(rowData);
                    }}
                  >
                    {item.title}
                  </Menu.Item>
                );
              })}
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item
              style={{ minWidth: 150 }}
              onClick={() => {
                FormDialog('新建数据表', () => {
                  return <SchemaField schema={dbschema} />;
                })
                  .open({
                    initialValues: {
                      // aaa: '123',
                    },
                  })
                  .then(() => {
                    const items = [...data];
                    items.push({ title: '数据表4' });
                    mutate(items);
                    const rowData = row(table());
                    insertBefore(rowData);
                  });
              }}
            >
              新建数据表
            </Menu.Item>
          </Menu.SubMenu>
          <Menu.Item
            onClick={() => {
              const rowData = row(markdown());
              insertBefore(rowData);
            }}
          >
            新建 Markdown
          </Menu.Item>
        </Menu>
      }
    >
      <Button icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
});

AddNew.FormItem = observer((props) => {
  const field = useField();

  const segments = [...field.address.segments];
  segments.pop();
  segments.pop();
  segments.pop();

  const { insertBefore, refresh, schema } = useSchemaQuery(segments);

  const insertBeforeHandle = () => {
    const rowData = row({
      type: 'string',
      // required: true,
      name: `f_${uid()}`,
      title: `字段${uid()}`,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'FormItem.DesignableBar',
      'x-component': 'Input',
    });
    console.log({ rowData });
    insertBefore(rowData);
  };
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item onClick={insertBeforeHandle} style={{ minWidth: 150 }}>
            字段1
          </Menu.Item>
          <Menu.Item onClick={insertBeforeHandle}>字段2</Menu.Item>
          <Menu.Item onClick={insertBeforeHandle}>字段3</Menu.Item>
          <Menu.Divider />
          <Menu.SubMenu title={'新增字段'}>
            <Menu.Item onClick={insertBeforeHandle} style={{ minWidth: 150 }}>
              单行文本
            </Menu.Item>
            <Menu.Item onClick={insertBeforeHandle}>多行文本</Menu.Item>
            <Menu.Item onClick={insertBeforeHandle}>电子邮箱</Menu.Item>
            <Menu.Item onClick={insertBeforeHandle}>手机号</Menu.Item>
            <Menu.Item onClick={insertBeforeHandle}>数字</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
});

export default AddNew;
