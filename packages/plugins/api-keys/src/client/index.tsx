import { CollectionManagerContext, SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { Configuration } from './Configuration';
import { useTranslation } from './locale';

const ApiKeysProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useTranslation();
  return (
    <SettingsCenterProvider
      settings={{
        map: {
          title: t('Map Manager'),
          icon: 'EnvironmentOutlined',
          tabs: {
            configuration: {
              title: t('Configuration'),
              component: Configuration,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{}}>
        <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces } }}>
          {props.children}
        </CollectionManagerContext.Provider>
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
ApiKeysProvider.displayName = 'ApiKeysProvider';

export default ApiKeysProvider;
