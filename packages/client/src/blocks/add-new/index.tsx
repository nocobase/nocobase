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

export const AddNew: any = observer((props) => {
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item>新建 Markdown</Menu.Item>
        </Menu>
      }
    >
      <Button icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
});

AddNew.FormItem = observer((props) => {
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item>字段 1</Menu.Item>
        </Menu>
      }
    >
      <Button icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
});

export default AddNew;
