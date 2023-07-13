import { Plugin, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { Localization } from './Localization';
import { useLocalTranslation } from './locale';

export class LocalizationManagementPlugin extends Plugin {
  async load() {
    this.app.use((props) => {
      const { t } = useLocalTranslation();
      return (
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
      );
    });
  }
}

export default LocalizationManagementPlugin;
