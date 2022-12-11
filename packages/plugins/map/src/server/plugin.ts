import { InstallOptions, Plugin } from '@nocobase/server';
import { LineStringField, PointField, PolygonField } from './fields';

export class MapPlugin extends Plugin {
  afterAdd() { }

  beforeLoad() {
    this.db.registerFieldTypes({
      point: PointField,
      polygon: PolygonField,
      lineString: LineStringField
    });
  }


  async load() { }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
