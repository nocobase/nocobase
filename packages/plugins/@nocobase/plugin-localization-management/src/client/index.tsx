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
            ['localization-management']: {
              title: t('Localization management'),
              icon: 'GlobalOutlined',
              tabs: {
                localization: {
                  title: t('Translations'),
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
