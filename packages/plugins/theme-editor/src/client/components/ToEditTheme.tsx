import { PlusOutlined } from '@ant-design/icons';
import { useGlobalTheme, useToken } from '@nocobase/client';
import { Button } from 'antd';
import React, { useCallback } from 'react';
import { useTranslation } from '../locale';
import { useThemeEditorContext } from './ThemeEditorProvider';

const ToEditTheme = () => {
  const { theme, setCurrentSettingTheme } = useGlobalTheme();
  const { token } = useToken();
  const { setOpen } = useThemeEditorContext();
  const { t } = useTranslation();

  const handleClick = useCallback(() => {
    setCurrentSettingTheme(theme);
    setOpen(true);
  }, [setCurrentSettingTheme, setOpen, theme]);

  return (
    <Button
      type={'dashed'}
      style={{
        width: 240,
        height: 240,
        borderRadius: token.borderRadiusLG,
        borderColor: '#f18b62',
        color: '#f18b62',
      }}
      icon={<PlusOutlined />}
      onClick={handleClick}
    >
      {t('Add New Theme')}
    </Button>
  );
};

ToEditTheme.displayName = 'ToEditTheme';

export default ToEditTheme;
