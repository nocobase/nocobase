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
import { useDesignable, useSchemaPath } from '../';
import { uid } from '@formily/shared';

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

export const AddNew = () => null;

AddNew.BlockItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter } = useDesignable();
  const path = useSchemaPath();

  return (
    <Dropdown
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
            onClick={() => {
              let data: ISchema = {
                type: 'void',
                title: uid(),
                'x-designable-bar': 'BlockItem.DesignableBar',
                'x-decorator': 'BlockItem',
                'x-component': 'Markdown',
              };
              console.log('isGridBlock(schema)', isGridBlock(schema));
              if (isGridBlock(schema)) {
                path.pop();
                path.pop();
                data = generateGridBlock(data);
              }
              if (data) {
                if (defaultAction === 'insertAfter') {
                  insertAfter(data, [...path]);
                } else {
                  insertBefore(data, [...path]);
                }
              }
            }}
          >
            新建 Markdown
          </Menu.Item>
        </Menu>
      }
    >
      {ghost ? <PlusOutlined /> : <Button icon={<PlusOutlined />}></Button>}
    </Dropdown>
  );
});

AddNew.FormItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter } = useDesignable();
  const path = useSchemaPath();
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.ItemGroup title={'选择已有字段'}>
            <Menu.Item
              style={{
                minWidth: 150,
              }}
              onClick={() => {
                let data: ISchema = {
                  type: 'void',
                  title: uid(),
                  'x-designable-bar': 'FormItem.DesignableBar',
                  'x-decorator': 'FormItem',
                  'x-component': 'Markdown',
                };
                if (isGridBlock(schema)) {
                  path.pop();
                  path.pop();
                  data = generateGridBlock(data);
                }
                if (data) {
                  if (defaultAction === 'insertAfter') {
                    insertAfter(data, [...path]);
                  } else {
                    insertBefore(data, [...path]);
                  }
                }
              }}
            >
              <Checkbox /> 字段 1
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段2
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段3
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段4
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段5
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段6
            </Menu.Item>
            <Menu.Item>
              <Checkbox /> 字段7
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu title={'新增字段'}>
            <Menu.Item
              style={{
                minWidth: 150,
              }}
            >
              单行文本
            </Menu.Item>
            <Menu.Item>多行文本</Menu.Item>
            <Menu.Item>手机号</Menu.Item>
            <Menu.Item>数字</Menu.Item>
            <Menu.Item>说明文本</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      {ghost ? <PlusOutlined /> : <Button icon={<PlusOutlined />}></Button>}
    </Dropdown>
  );
});

export default AddNew;
