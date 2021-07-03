import React, { useState } from 'react';
import classNames from 'classnames';
import { useField, observer, RecursionField, Schema } from '@formily/react';
import { Dropdown, Menu, Switch } from 'antd';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export const DesignableBar = (props) => {
  const [active, setActive] = useState(false);
  const field = useField();
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
      <Menu.Item onClick={() => {}}>
        <Switch
          onChange={(checked) => {
            // field.query(key).take((target: Formily.Core.Models.Field) => {
            //   target.required = checked;
            // });
          }}
          checkedChildren="必填"
          unCheckedChildren="非必填"
        />
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
