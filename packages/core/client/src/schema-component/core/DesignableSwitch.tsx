import { HighlightOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { PluginManager } from '../../plugin-manager';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  const { t } = useTranslation();
  const style = {};
  if (designable) {
    style['backgroundColor'] = '#f18b62';
  }
  return (
    <PluginManager.Toolbar.Item
      selected={designable}
      icon={<HighlightOutlined />}
      title={t('UI Editor')}
      subtitle={'⌘+Shift+E'}
      style={style}
      onClick={() => {
        setDesignable(!designable);
      }}
    ></PluginManager.Toolbar.Item>
  );
};
