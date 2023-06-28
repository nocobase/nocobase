import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from './locale';
import CustomTheme from './theme-editor';

const CustomThemeProvider = React.memo((props) => {
  const { t } = useTranslation();
  const settings = {
    theme: {
      title: t('Theme'),
      icon: 'BgColorsOutlined',
      tabs: {
        themes: {
          title: t('Local'),
          component: () => <div>Custom theme</div>,
        },
      },
    },
  };
  const editor = (
    <div style={{ display: 'flex' }}>
      <div style={{ transform: 'rotate(0)', flexGrow: 1 }}>{props.children}</div>
      <div style={{ overflow: 'hidden', borderLeft: '1px solid #f0f0f0' }}>
        <CustomTheme />
      </div>
    </div>
  );

  return <SettingsCenterProvider settings={settings}>{editor}</SettingsCenterProvider>;
});
CustomThemeProvider.displayName = 'CustomThemeProvider';

export default CustomThemeProvider;
