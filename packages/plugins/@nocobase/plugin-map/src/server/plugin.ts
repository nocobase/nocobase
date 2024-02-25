import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
import { getConfiguration, setConfiguration } from './actions';
import { CircleField, LineStringField, PointField, PolygonField } from './fields';
import { CircleValueParser, LineStringValueParser, PointValueParser, PolygonValueParser } from './value-parsers';

export class MapPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    const fields = {
      point: PointField,
      polygon: PolygonField,
      lineString: LineStringField,
      circle: CircleField,
    };
    this.db.registerFieldTypes(fields);
    this.db.registerFieldValueParsers({
      point: PointValueParser,
      polygon: PolygonValueParser,
      lineString: LineStringValueParser,
      circle: CircleValueParser,
    });
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.resource({
      name: 'map-configuration',
      actions: {
        get: getConfiguration,
        set: setConfiguration,
      },
      only: ['get', 'set'],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.configuration`,
      actions: ['map-configuration:set'],
    });

    this.app.acl.allow('map-configuration', 'get', 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MapPlugin;
