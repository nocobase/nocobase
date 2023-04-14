import { SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from './locale';
import { AppConfiguration, InterfaceConfiguration } from './configuration';

export default React.memo((props) => {
  const { t } = useTranslation();

  return (
    <SettingsCenterProvider
      settings={{
        ['mobile-client']: {
          title: t('Mobile Client-side'),
          icon: 'MobileOutlined',
          tabs: {
            'interface-configuration': {
              title: t('Interface Configuration'),
              component: InterfaceConfiguration,
            },
            'app-configuration': {
              title: t('App Configuration'),
              component: AppConfiguration,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{}}>{props.children}</SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
