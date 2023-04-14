import { SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useTranslation } from './locale';
import { Configuration } from './configuration';

const ComingSoon = () => <div>Coming Soon</div>;

export default React.memo((props) => {
  const { t } = useTranslation();

  return (
    <SettingsCenterProvider
      settings={{
        ['mobile-client']: {
          title: t('Mobile Client-side'),
          icon: 'PhoneOutlined',
          tabs: {
            'interface-configuration': {
              title: t('Interface Configuration'),
              component: Configuration,
            },
            'app-configuration': {
              title: t('App Configuration'),
              component: ComingSoon,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{}}>{props.children}</SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
