import { InstallOptions, Plugin } from '@nocobase/server';
import { PointField } from './fields/point';
import { PolygonField } from './fields/polygon';

export class MapPlugin extends Plugin {
  afterAdd() { }

  beforeLoad() {
    this.db.registerFieldTypes({
      point: PointField,
      polygon: PolygonField
    });
  }


  async load() { }

  async install(options?: InstallOptions) { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default MapPlugin;
