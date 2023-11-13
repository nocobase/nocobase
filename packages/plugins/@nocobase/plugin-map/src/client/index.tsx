import { CollectionManagerContext, CurrentAppInfoProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React, { useContext } from 'react';
import { MapBlockOptions } from './block';
import { Configuration, Map } from './components';
import { interfaces } from './fields';
import { MapInitializer } from './initialize';
import { NAMESPACE } from './locale';

const MapProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <CurrentAppInfoProvider>
      <MapInitializer>
        <SchemaComponentOptions components={{ Map }}>
          <MapBlockOptions>
            <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces, ...interfaces } }}>
              {props.children}
            </CollectionManagerContext.Provider>
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
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Map Manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'EnvironmentOutlined',
      Component: Configuration,
      aclSnippet: 'pm.map.configuration',
    });
  }
}

export default MapPlugin;
