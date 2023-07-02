import { css } from '@emotion/css';
import { useGlobalTheme } from '@nocobase/client';
import { Button, ConfigProvider, Space, Typography } from 'antd';
import antdEnUs from 'antd/locale/en_US';
import antdZhCN from 'antd/locale/zh_CN';
import React from 'react';
import { ThemeConfig } from '../../../types';
import { ThemeEditor, enUS, zhCN } from '../../antd-token-previewer';
import { useTranslation } from '../../locale';
import { useThemeEditorContext } from '../ThemeEditorProvider';
import ThemeSettingModal from './ThemeSettingModal';

const useStyle = () => ({
  editor: css({
    '& > div:nth-child(2)': {
      display: 'none',
    },
  }),
  header: css({
    display: 'flex',
    height: 56,
    alignItems: 'center',
    padding: '0 24px',
    justifyContent: 'space-between',
    borderBottom: '1px solid #F0F0F0',
  }),
});

const CustomTheme = ({ onThemeChange }: { onThemeChange?: (theme: ThemeConfig) => void }) => {
  const styles = useStyle();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useGlobalTheme();
  const [theme, setTheme] = React.useState<ThemeConfig>(globalTheme);
  const { setOpen } = useThemeEditorContext();
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const themeRef = React.useRef(globalTheme);

  const lang = i18n.language;

  const handleSave = () => {
    setIsModalOpen(true);
  };
  const handleModalOk = () => {
    setIsModalOpen(false);
    setOpen(false);
  };
  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    setGlobalTheme(themeRef.current);
  };

  return (
    <>
      <ConfigProvider theme={{ inherit: false }} locale={lang === 'zh-CN' ? antdZhCN : antdEnUs}>
        <div className={styles.header}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Theme Editor')}
          </Typography.Title>
          <Space>
            <Button type="default" onClick={handleClose}>
              {t('Close')}
            </Button>
            <Button type="primary" onClick={handleSave}>
              {t('Save')}
            </Button>
          </Space>
        </div>
        <ThemeEditor
          className={styles.editor}
          theme={{ name: 'Custom Theme', key: 'test', config: theme }}
          style={{ height: 'calc(100vh - 56px)', width: 540 }}
          onThemeChange={(newTheme) => {
            setTheme(newTheme.config);
            onThemeChange?.(newTheme.config);
          }}
          locale={lang === 'zh-CN' ? zhCN : enUS}
        />
      </ConfigProvider>
      <ThemeSettingModal open={isModalOpen} onOk={handleModalOk} onCancel={handleModalCancel} theme={theme} />
    </>
  );
};

export default CustomTheme;
