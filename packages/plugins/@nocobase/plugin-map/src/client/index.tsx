import { CurrentAppInfoProvider, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { MapBlockOptions } from './block';
import { mapActionInitializers } from './block/MapActionInitializers';
import { Configuration, Map } from './components';
import { fields } from './fields';
import { generateNTemplate } from './locale';
import { NAMESPACE } from './locale';
import { mapBlockSettings } from './block/MapBlock.Settings';
const MapProvider = React.memo((props) => {
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions components={{ Map }}>
        <MapBlockOptions>{props.children}</MapBlockOptions>
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});
MapProvider.displayName = 'MapProvider';

export class MapPlugin extends Plugin {
  async load() {
    this.app.use(MapProvider);

    this.app.dataSourceManager.addFieldInterfaces(fields);
    this.app.dataSourceManager.addFieldInterfaceGroups({
      map: {
        label: generateNTemplate('Map-based geometry'),
        order: 51,
      },
    });
    this.app.schemaInitializerManager.add(mapActionInitializers);
    this.schemaSettingsManager.add(mapBlockSettings);

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
