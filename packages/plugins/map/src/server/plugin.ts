import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { getConfiguration, setConfiguration } from './actions';
import { CircleField, LineStringField, PointField, PolygonField } from './fields';

export class MapPlugin extends Plugin {
  afterAdd() { }

  beforeLoad() {
    const fields = {
      point: PointField,
      polygon: PolygonField,
      lineString: LineStringField,
      circle: CircleField
    };

    this.db.registerFieldTypes(fields);
  }


  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.resource(({
      name: 'map-configuration',
      actions: {
        get: getConfiguration,
        set: setConfiguration
      },
      only: ['get', 'set']
    }));

    this.registerACLSettingSnippet({
      name: 'map-configuration',
      actions: [
        'map-configuration:*',
      ],
    });

  }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
