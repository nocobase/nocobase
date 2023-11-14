import { Plugin, createStyles, defaultTheme, useCurrentUserSettingsMenu, useGlobalTheme } from '@nocobase/client';
import { ConfigProvider } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import InitializeTheme from './components/InitializeTheme';
import { ThemeEditorProvider } from './components/ThemeEditorProvider';
import ThemeList from './components/ThemeList';
import { ThemeListProvider } from './components/ThemeListProvider';
import CustomTheme from './components/theme-editor';
import { useThemeSettings } from './hooks/useThemeSettings';
import { NAMESPACE } from './locale';

const useStyles = createStyles(({ css, token }) => {
  return {
    editor: css`
      overflow: hidden;
      border-left: 1px solid ${token.colorBorderSecondary};
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
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useGlobalTheme();
  const { styles } = useStyles();

  useEffect(() => {
    // 在页面右上角中添加一个 Theme 菜单项
    addMenuItem(themeItem, { before: 'divider_3' });
  }, [addMenuItem, themeItem]);

  const contentStyle = useMemo(() => {
    return open
      ? { transform: 'rotate(0)', flexGrow: 1, width: 0, height: '100%' }
      : { flexGrow: 1, width: 0, height: '100%' };
  }, [open]);

  const editor = (
    <div style={{ display: 'flex', overflow: 'hidden', height: '100%' }}>
      <div style={contentStyle}>{props.children}</div>
      {open ? (
        <div className={styles.editor}>
          <CustomTheme onThemeChange={setTheme} />
        </div>
      ) : null}
    </div>
  );

  if (!theme?.token?.motionUnit) {
    _.set(theme, 'token.motionUnit', defaultTheme.token.motionUnit);
  }

  return (
    <ConfigProvider theme={theme}>
      <ThemeListProvider>
        <InitializeTheme>
          <ThemeEditorProvider open={open} setOpen={setOpen}>
            {editor}
          </ThemeEditorProvider>
        </InitializeTheme>
      </ThemeListProvider>
    </ConfigProvider>
  );
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export class ThemeEditorPlugin extends Plugin {
  async load() {
    this.app.use(CustomThemeProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Theme editor", {ns:"${NAMESPACE}"})}}`,
      icon: 'BgColorsOutlined',
      Component: ThemeList,
      aclSnippet: 'pm.theme-editor.themes',
    });
  }
}

export default ThemeEditorPlugin;
