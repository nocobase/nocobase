import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { ThemeEditorProvider } from './components/ThemeEditorProvider';
import ThemeList from './components/ThemeList';
import CustomTheme from './components/theme-editor';
import { useTranslation } from './locale';

const CustomThemeProvider = React.memo((props) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
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
          <CustomTheme />
        </div>
      ) : null}
    </div>
  );

  return (
    <ThemeEditorProvider open={open} setOpen={setOpen}>
      <SettingsCenterProvider settings={settings}>{editor}</SettingsCenterProvider>
    </ThemeEditorProvider>
  );
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export default CustomThemeProvider;
