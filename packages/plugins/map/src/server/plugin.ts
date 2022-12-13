import { InstallOptions, Plugin } from '@nocobase/server';
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


  async load() { }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
