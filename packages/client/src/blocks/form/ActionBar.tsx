import React, { useState } from 'react';
import classNames from 'classnames';
import { useField, observer, RecursionField, Schema } from '@formily/react';
import { Dropdown, Menu } from 'antd';
import { useSchemaQuery } from '../grid';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export const ActionBar = (props) => {
  const { addBlock, removeBlock } = useSchemaQuery();
  const [active, setActive] = useState(false);
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
