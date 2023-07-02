import { SettingsCenterProvider, useCurrentUserSettingsMenu, useGlobalTheme } from '@nocobase/client';
import { ConfigProvider } from 'antd';
import React from 'react';
import { ThemeEditorProvider } from './components/ThemeEditorProvider';
import ThemeList from './components/ThemeList';
import { ThemeListProvider } from './components/ThemeListProvider';
import CustomTheme from './components/theme-editor';
import { useThemeSettings } from './hooks/useThemeSettings';
import { useTranslation } from './locale';

const CustomThemeProvider = React.memo((props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();
  const themeItem = useThemeSettings();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useGlobalTheme();

  // 在页面右上角中添加一个 Theme 菜单项
  addMenuItem(themeItem, { after: 'role' });

  const settings = {
    theme: {
      title: t('Theme'),
      icon: 'BgColorsOutlined',
      tabs: {
        themes: {
          title: t('Local'),
          component: ThemeList,
        },
      },
    },
  };
  const editor = (
    <div style={{ display: 'flex' }}>
      <div style={{ transform: 'rotate(0)', flexGrow: 1 }}>{props.children}</div>
      {open ? (
        <div style={{ overflow: 'hidden', borderLeft: '1px solid #f0f0f0' }}>
          <CustomTheme onThemeChange={setTheme} />
        </div>
      ) : null}
    </div>
  );

  return (
    <ConfigProvider theme={theme}>
      <ThemeListProvider>
        <ThemeEditorProvider open={open} setOpen={setOpen}>
          <SettingsCenterProvider settings={settings}>{editor}</SettingsCenterProvider>
        </ThemeEditorProvider>
      </ThemeListProvider>
    </ConfigProvider>
  );
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export default CustomThemeProvider;
