import { SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { Configuration } from './Configuration';
import { useTranslation } from './locale';

const ApiKeysProvider = React.memo((props) => {
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        ['api-keys']: {
          title: t('Api keys'),
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

export default ApiKeysProvider;
