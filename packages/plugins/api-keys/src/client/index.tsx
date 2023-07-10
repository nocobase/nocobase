import { Plugin, SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { Configuration } from './Configuration';
import { useTranslation } from './locale';

const ApiKeysProvider = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        ['api-keys']: {
          title: t('API keys'),
          icon: 'EnvironmentOutlined',
          tabs: {
            configuration: {
              title: t('Keys manager'),
              component: Configuration,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{}}>{props.children}</SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
ApiKeysProvider.displayName = 'ApiKeysProvider';

class APIKeysPlugin extends Plugin {
  async load() {
    this.app.addProvider(ApiKeysProvider);
  }
}

export default APIKeysPlugin;
