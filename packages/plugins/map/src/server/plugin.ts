import { InstallOptions, Plugin } from '@nocobase/server';
import { CircleField, LineStringField, PointField, PolygonField } from './fields';
import { resolve } from 'path';
import { getConfiguration, setConfiguration } from './actions';

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
    }))

  }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
