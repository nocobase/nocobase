import { HighlightOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { PluginManager } from '../../plugin-manager';
import { useHotkeys } from 'react-hotkeys-hook'

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  const { t } = useTranslation();
  const style = {};
  if (designable) {
    style['backgroundColor'] = '#f18b62';
  }

  // 快捷键切换编辑状态
  useHotkeys('Ctrl+Shift+U', () => setDesignable(!designable), [designable])

  return (
    <PluginManager.Toolbar.Item
      selected={designable}
      icon={<HighlightOutlined />}
      title={t('UI Editor')}
      subtitle={'Ctrl+Shift+U'}
      style={style}
      onClick={() => {
        setDesignable(!designable);
      }}
    ></PluginManager.Toolbar.Item>
  );
};
