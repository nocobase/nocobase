import {
  CollectionManagerContext,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  SettingsCenterProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { MapBlockOptions } from './block';
import Configuration from './components/Configuration';
import Map from './components/Map';
import { interfaces } from './fields';
import { MapInitializer } from './initialize';
import { useMapTranslation } from './locale';
import './locale';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useMapTranslation();
  return (
    <CurrentAppInfoProvider>
      <MapInitializer>
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
          <SchemaComponentOptions components={{ Map }}>
            <MapBlockOptions>
              <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, ...interfaces } }}>
                {props.children}
              </CollectionManagerContext.Provider>
            </MapBlockOptions>
          </SchemaComponentOptions>
        </SettingsCenterProvider>
      </MapInitializer>
    </CurrentAppInfoProvider>
  );
});
