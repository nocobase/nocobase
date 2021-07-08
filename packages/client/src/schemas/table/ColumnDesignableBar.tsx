import React, { useState } from 'react';
import classNames from 'classnames';
import { useField, observer, RecursionField, Schema } from '@formily/react';
import { Dropdown, Menu } from 'antd';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export const ColumnDesignableBar = (props) => {
  const [active, setActive] = useState(false);
  return (
    <>
      <Menu.Item
        onClick={() => {
          setActive(false);
        }}
        icon={<ArrowUpOutlined />}
      >
        在上方插入区块
      </Menu.Item>
      <Menu.Item
        onClick={() => {
          setActive(false);
        }}
        icon={<ArrowDownOutlined />}
      >
        在下方插入区块
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        onClick={() => {
          setActive(false);
        }}
        icon={<DeleteOutlined />}
      >
        删除区块
      </Menu.Item>
    </>
  );
};
