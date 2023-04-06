import { HighlightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  const { t } = useTranslation();
  const style = {};
  if (designable) {
    style['backgroundColor'] = '#f18b62';
  }

  // 快捷键切换编辑状态
  useHotkeys('Ctrl+Shift+U', () => setDesignable(!designable), [designable]);

  return (
    <Button
      // selected={designable}
      icon={<HighlightOutlined />}
      title={t('UI Editor')}
      // subtitle={'Ctrl+Shift+U'}
      style={style}
      onClick={() => {
        setDesignable(!designable);
      }}
    />
  );
};
