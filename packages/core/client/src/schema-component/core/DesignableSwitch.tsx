import { HighlightOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '..';
import { useToken } from '../../style';

export const DesignableSwitch = () => {
  const { designable, setDesignable } = useDesignable();
  const { t } = useTranslation();
  const { token } = useToken();
  const style = {};
  if (designable) {
    style['backgroundColor'] = 'var(--colorSettings)';
  }

  // 快捷键切换编辑状态
  useHotkeys('Ctrl+Shift+U', () => setDesignable(!designable), [designable]);

  return (
    <Tooltip title={t('UI Editor')}>
      <Button
        data-testid={'ui-editor-button'}
        // selected={designable}
        icon={<HighlightOutlined style={{ color: token.colorTextHeaderMenu }} />}
        title={t('UI Editor')}
        // subtitle={'Ctrl+Shift+U'}
        style={style}
        onClick={() => {
          setDesignable(!designable);
        }}
      />
    </Tooltip>
  );
};
