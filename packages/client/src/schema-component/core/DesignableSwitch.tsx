import { HighlightOutlined } from '@ant-design/icons';
import React from 'react';
import { useDesignable } from '..';
import { PluginManager } from '../../plugin-manager';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  const style = {};
  if (designable) {
    style['backgroundColor'] = '#f18b62';
  }
  return (
    <PluginManager.Toolbar.Item
      selected={designable}
      icon={<HighlightOutlined />}
      title={'界面配置'}
      style={style}
      onClick={() => {
        setDesignable(!designable);
      }}
    ></PluginManager.Toolbar.Item>
  );
};
