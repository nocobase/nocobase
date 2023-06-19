import { Plugin } from '@nocobase/client';
import { MapProvider } from './MapProvider';

export class MapPlugin extends Plugin {
  async load() {
    this.app.use(MapProvider);
  }
}

export default MapPlugin;
