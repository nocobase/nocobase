import {
  Plugin,
  SettingsCenterProvider,
  createStyles,
  useCurrentUserSettingsMenu,
  useGlobalTheme,
} from '@nocobase/client';
import { ConfigProvider } from 'antd';
import React, { useEffect, useMemo } from 'react';
import InitializeTheme from './components/InitializeTheme';
import { ThemeEditorProvider } from './components/ThemeEditorProvider';
import ThemeList from './components/ThemeList';
import { ThemeListProvider } from './components/ThemeListProvider';
import CustomTheme from './components/theme-editor';
import { useThemeSettings } from './hooks/useThemeSettings';
import { useTranslation } from './locale';

const useStyles = createStyles(({ css }) => {
  return {
    editor: css`
      animation: 0.1s ease-out 0s 1 slideInFromRight;
      @keyframes slideInFromRight {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(0);
        }
      }
    `,
  };
});

const CustomThemeProvider = React.memo((props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();
  const themeItem = useThemeSettings();
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useGlobalTheme();
  const { styles } = useStyles();

  useEffect(() => {
    // 在页面右上角中添加一个 Theme 菜单项
    addMenuItem(themeItem, { after: 'role' });
  }, [themeItem]);

  const settings = useMemo(() => {
    return {
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
  }, []);

  const contentStyle = useMemo(() => {
    return open ? { transform: 'rotate(0)', flexGrow: 1, width: 0 } : { flexGrow: 1, width: 0 };
  }, [open]);

  const editor = (
    <div style={{ display: 'flex', overflow: 'hidden' }}>
      <div style={contentStyle}>{props.children}</div>
      {open ? (
        <div className={styles.editor} style={{ overflow: 'hidden', borderLeft: '1px solid #f0f0f0' }}>
          <CustomTheme onThemeChange={setTheme} />
        </div>
      ) : null}
    </div>
  );

  return (
    <ConfigProvider theme={theme}>
      <ThemeListProvider>
        <InitializeTheme>
          <ThemeEditorProvider open={open} setOpen={setOpen}>
            <SettingsCenterProvider settings={settings}>{editor}</SettingsCenterProvider>
          </ThemeEditorProvider>
        </InitializeTheme>
      </ThemeListProvider>
    </ConfigProvider>
  );
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export class CustomThemePlugin extends Plugin {
  async load() {
    this.app.use(CustomThemeProvider);
  }
}

export default CustomThemePlugin;
