import {
  CollectionManagerContext,
  CurrentAppInfoProvider,
  Plugin,
  SchemaComponentOptions,
  SettingsCenterProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { MapBlockOptions } from './block';
import { mapActionInitializers } from './block/MapActionInitializers';
import { Configuration, Map } from './components';
import { interfaces } from './fields';
import { MapInitializer } from './initialize';
import { generateNTemplate, useMapTranslation } from './locale';

const MapProvider = React.memo((props) => {
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
MapProvider.displayName = 'MapProvider';

export class MapPlugin extends Plugin {
  async load() {
    this.app.use(MapProvider);

    this.app.schemaInitializerManager.add(mapActionInitializers);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.map', {
      title: generateNTemplate('Map'),
      Component: 'MapBlockInitializer',
    });
  }
}

export default MapPlugin;
