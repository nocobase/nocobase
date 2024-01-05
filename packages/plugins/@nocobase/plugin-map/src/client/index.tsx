import { CollectionManagerProvider, CurrentAppInfoProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { MapBlockOptions } from './block';
import { mapActionInitializers } from './block/MapActionInitializers';
import { Configuration, Map } from './components';
import { interfaces } from './fields';
import { MapInitializer } from './initialize';
import { generateNTemplate } from './locale';
import { NAMESPACE } from './locale';

const MapProvider = React.memo((props) => {
  return (
    <CurrentAppInfoProvider>
      <MapInitializer>
        <SchemaComponentOptions components={{ Map }}>
          <MapBlockOptions>
            <CollectionManagerProvider interfaces={interfaces}>{props.children}</CollectionManagerProvider>
          </MapBlockOptions>
        </SchemaComponentOptions>
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

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Map Manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'EnvironmentOutlined',
      Component: Configuration,
      aclSnippet: 'pm.map.configuration',
    });
  }
}

export default MapPlugin;
