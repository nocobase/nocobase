import React, { useState } from 'react';
import classNames from 'classnames';
import { useField, observer, RecursionField, Schema } from '@formily/react';
import { Dropdown, Menu, Switch } from 'antd';
import { useSchemaQuery } from '../grid';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export const DesignableBar = (props) => {
  const { schema, addBlock, removeBlock, refresh } = useSchemaQuery();
  const [active, setActive] = useState(false);
  const field = useField();
  return (
    <>
      <Menu.Item
        onClick={() => {
          addBlock(
            {},
            {
              insertBefore: true,
            },
          );
          setActive(false);
        }}
        icon={<ArrowUpOutlined />}
      >
        在上方插入区块
      </Menu.Item>
      <Menu.Item
        onClick={() => {
          addBlock();
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
            const key = Object.keys(schema.properties).shift();
            schema.properties[key].required = checked;
            refresh();
            field.query(key).take((target: Formily.Core.Models.Field) => {
              target.required = checked;
            });
          }}
          checkedChildren="必填"
          unCheckedChildren="非必填"
        />
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        onClick={() => {
          removeBlock();
          setActive(false);
        }}
        icon={<DeleteOutlined />}
      >
        删除区块
      </Menu.Item>
    </>
  );
};
