import React from 'react';
import { Button, Menu } from 'antd';
import { HighlightOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { useDesignable } from '..';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  return (
    <Menu.Item key={'DesignableSwitch'} eventKey={'DesignableSwitch'}>
      <HighlightOutlined />
    </Menu.Item>
  );
};
