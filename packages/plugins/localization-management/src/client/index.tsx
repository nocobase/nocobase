import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useLocalTranslation } from './locale';
import { Localization } from './Localization';
import { LocalizationProvider } from './LocalizationProvider';

export default (props) => {
  const { t } = useLocalTranslation();
  return (
    <LocalizationProvider>
      <SettingsCenterProvider
        settings={{
          localization: {
            title: t('Localization'),
            icon: 'GlobalOutlined',
            tabs: {
              localization: {
                title: t('Localization'),
                component: () => <Localization />,
              },
            },
          },
        }}
      >
        {props.children}
      </SettingsCenterProvider>
    </LocalizationProvider>
  );
};
