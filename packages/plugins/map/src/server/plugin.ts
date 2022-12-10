import { InstallOptions, Plugin } from '@nocobase/server';
import { LinestringField, PointField, PolygonField } from './fields';

export class MapPlugin extends Plugin {
  afterAdd() { }

  beforeLoad() {
    this.db.registerFieldTypes({
      point: PointField,
      polygon: PolygonField,
      linestring: LinestringField
    });
  }


  async load() { }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
