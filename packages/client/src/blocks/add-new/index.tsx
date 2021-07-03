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
import { useDesignable, useSchemaPath } from '../DesignableSchemaField';
import { uid } from '@formily/shared';

export const AddNew: any = observer((props) => {
  const { schema, insertBefore } = useDesignable();
  const path = useSchemaPath();
  if (schema.parent['x-component'] === 'Grid.Block') {
    path.pop(); // block
    path.pop(); // col
    path.pop(); // row
  }
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item
            onClick={() => {
              insertBefore({
                type: 'void',
                name: uid(),
                "x-component": 'Grid.Row',
                properties: {
                  [uid()]: {
                    type: 'void',
                    "x-component": 'Grid.Col',
                    properties: {
                      [uid()]: {
                        type: 'void',
                        "x-component": 'Grid.Block',
                        properties: {
                          [uid()]: {
                            type: 'void',
                            title: uid(),
                            'x-designable-bar': 'FormItem.DesignableBar',
                            "x-decorator": 'FormItem',
                            'x-component': 'Markdown',
                          }
                        }
                      },
                    },
                  },
                },
              }, [...path]);
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
  const { schema, insertBefore } = useDesignable();
  const path = useSchemaPath();
  if (schema.parent['x-component'] === 'Grid.Block') {
    path.pop(); // block
    path.pop(); // col
    path.pop(); // row
  }
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item
            onClick={() => {
              insertBefore({
                type: 'void',
                name: uid(),
                "x-component": 'Grid.Row',
                properties: {
                  [uid()]: {
                    type: 'void',
                    "x-component": 'Grid.Col',
                    properties: {
                      [uid()]: {
                        type: 'void',
                        "x-component": 'Grid.Block',
                        properties: {
                          [uid()]: {
                            type: 'void',
                            title: uid(),
                            'x-designable-bar': 'FormItem.DesignableBar',
                            "x-decorator": 'FormItem',
                            'x-component': 'Markdown',
                          }
                        }
                      },
                    },
                  },
                },
              }, [...path]);
            }}
          >
            字段 1
          </Menu.Item>
        </Menu>
      }
    >
      <Button icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
});

export default AddNew;
