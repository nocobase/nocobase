import {
  CollectionManagerContext,
  CollectionManagerProvider,
  SchemaComponentOptions,
  SettingsCenterProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { apiKeysCollection } from '../collections';
import { Configuration } from './Configuration';
import { useTranslation } from './locale';

const ApiKeysProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
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
      <SchemaComponentOptions components={{}}>
        <CollectionManagerProvider collections={[apiKeysCollection]}>{props.children}</CollectionManagerProvider>
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
ApiKeysProvider.displayName = 'ApiKeysProvider';

export default ApiKeysProvider;
