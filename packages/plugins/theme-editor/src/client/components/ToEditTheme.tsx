import { PlusOutlined } from '@ant-design/icons';
import { compatOldTheme, defaultTheme, useGlobalTheme, useToken } from '@nocobase/client';
import { App, Button, Space } from 'antd';
import React, { useCallback } from 'react';
import { useTranslation } from '../locale';
import { useThemeEditorContext } from './ThemeEditorProvider';

const ToEditTheme = () => {
  const { theme, setTheme, setCurrentSettingTheme } = useGlobalTheme();
  const { token } = useToken();
  const { setOpen } = useThemeEditorContext();
  const { t } = useTranslation();
  const { modal } = App.useApp();

  const handleClick = useCallback(() => {
    const m = modal.confirm({
      title: t('Add new theme'),
      closable: true,
      maskClosable: true,
      width: 'fit-content',
      footer: (
        <Space style={{ float: 'right', marginTop: token.margin, justifyContent: 'flex-end' }} wrap>
          <Button
            onClick={() => {
              setCurrentSettingTheme(theme);
              setTheme(compatOldTheme(theme));
              setOpen(true);
              m.destroy();
            }}
          >
            {t('Edit based on current theme')}
          </Button>
          <Button
            type={'primary'}
            onClick={() => {
              setCurrentSettingTheme(theme);
              setTheme(compatOldTheme(defaultTheme));
              setOpen(true);
              m.destroy();
            }}
          >
            {t('Create a brand new theme')}
          </Button>
        </Space>
      ),
    });
  }, [modal, setCurrentSettingTheme, setOpen, setTheme, t, theme, token.margin]);

  return (
    <Button
      type={'dashed'}
      style={{
        width: 240,
        height: 240,
        borderRadius: token.borderRadiusLG,
        borderColor: 'var(--colorSettings)',
        color: 'var(--colorSettings)',
      }}
      icon={<PlusOutlined />}
      onClick={handleClick}
    >
      {t('Add new theme')}
    </Button>
  );
};

ToEditTheme.displayName = 'ToEditTheme';

export default ToEditTheme;
