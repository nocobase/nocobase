import {
  CollectionManagerContext,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  SettingsCenterProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import Configuration from './components/Configuration';
import Map from './components/Map';
import { interfaces } from './fields';
import { Initialize } from './initialize';
import { useMapTranslation } from './locales';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useMapTranslation();
  return (
    <CurrentAppInfoProvider>
      <Initialize>
        <SettingsCenterProvider
          settings={{
            'map-configuration': {
              title: t('Map Configuration'),
              icon: 'MapOutlined',
              tabs: {
                configuration: {
                  title: t('Configuration'),
                  component: Configuration,
                },
              },
            },
          }}
        >
          <SchemaComponentOptions components={{ Map }}>
            <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, ...interfaces } }}>
              {props.children}
            </CollectionManagerContext.Provider>
          </SchemaComponentOptions>
        </SettingsCenterProvider>
      </Initialize>
    </CurrentAppInfoProvider>
  );
});
