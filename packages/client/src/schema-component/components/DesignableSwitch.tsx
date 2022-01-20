import React from 'react';
import { Button, Menu } from 'antd';
import { HighlightOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { useDesignable } from '..';
import { PluginManager } from '../../plugin-manager';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  return (
    <PluginManager.Toolbar.Item
      selected={designable}
      icon={<HighlightOutlined />}
      title={'界面配置'}
      onClick={() => {
        setDesignable(!designable);
      }}
    ></PluginManager.Toolbar.Item>
  );
};
