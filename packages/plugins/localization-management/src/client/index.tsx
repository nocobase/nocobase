import { Plugin, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { useLocalTranslation } from './locale';
import { Localization } from './Localization';
import { LocalizationProvider } from './LocalizationProvider';

export class LocalizationManagementPlugin extends Plugin {
  async load() {
    this.app.use((props) => {
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
    });
  }
}

export default LocalizationManagementPlugin;
