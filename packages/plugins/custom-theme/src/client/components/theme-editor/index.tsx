import { css } from '@emotion/css';
import { Button, ConfigProvider, Input, Modal, Space, Typography } from 'antd';
import { ThemeEditor, enUS, zhCN } from 'antd-token-previewer';
import type { ThemeConfig } from 'antd/es/config-provider/context';
import antdEnUs from 'antd/locale/en_US';
import antdZhCN from 'antd/locale/zh_CN';
import React from 'react';
import { useTranslation } from '../../locale';
import { useThemeEditorContext } from '../ThemeEditorProvider';

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
  const [theme, setTheme] = React.useState<ThemeConfig>({});
  const { setOpen } = useThemeEditorContext();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { t, i18n } = useTranslation();

  const lang = i18n.language;

  const handleSave = () => {
    setIsModalOpen(true);
  };
  const toSave = () => {
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
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
      <Modal title={t('Save theme')} open={isModalOpen} onOk={toSave} onCancel={() => setIsModalOpen(false)}>
        <Input placeholder={t('Please set a name for this theme')} />
      </Modal>
    </>
  );
};

export default CustomTheme;
