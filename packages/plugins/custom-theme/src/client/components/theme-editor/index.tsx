import { css } from '@emotion/css';
import { Button, ConfigProvider, Typography } from 'antd';
import { ThemeEditor, enUS, zhCN } from 'antd-token-previewer';
import type { ThemeConfig } from 'antd/es/config-provider/context';
import React from 'react';

const locales = {
  cn: {
    title: '主题编辑器',
    save: '保存',
    edit: '编辑',
    export: '导出',
    editModelTitle: '编辑主题配置',
    editJsonContentTypeError: '主题 JSON 格式错误',
    editSuccessfully: '编辑成功',
    saveSuccessfully: '保存成功',
    initialEditor: '正在初始化编辑器...',
  },
  en: {
    title: 'Theme Editor',
    save: 'Save',
    edit: 'Edit',
    export: 'Export',
    editModelTitle: 'edit Theme Config',
    editJsonContentTypeError: 'The theme of the JSON format is incorrect',
    editSuccessfully: 'Edited successfully',
    saveSuccessfully: 'Saved successfully',
    initialEditor: 'Initializing Editor...',
  },
};

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

const ANT_DESIGN_V5_THEME_EDITOR_THEME = 'ant-design-v5-theme-editor-theme';

const CustomTheme = () => {
  const styles = useStyle();
  const [theme, setTheme] = React.useState<ThemeConfig>({});

  const lang = 'cn';
  const locale = locales[lang];

  const handleSave = () => {
    localStorage.setItem(ANT_DESIGN_V5_THEME_EDITOR_THEME, JSON.stringify(theme));
  };

  return (
    <div>
      <ConfigProvider theme={{ inherit: false }}>
        <div className={styles.header}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {locale.title}
          </Typography.Title>
          <Button type="primary" onClick={handleSave}>
            {locale.save}
          </Button>
        </div>
        <ThemeEditor
          className={styles.editor}
          theme={{ name: 'Custom Theme', key: 'test', config: theme }}
          style={{ height: 'calc(100vh - 56px)', width: 540 }}
          onThemeChange={(newTheme) => {
            setTheme(newTheme.config);
          }}
          locale={lang === 'cn' ? zhCN : enUS}
        />
      </ConfigProvider>
    </div>
  );
};

export default CustomTheme;
