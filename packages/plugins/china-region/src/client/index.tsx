import { Plugin } from '@nocobase/client';
import { ChinaRegionProvider } from './ChinaRegionProvider';

export class ChinaRegionPlugin extends Plugin {
  async load() {
    this.app.use(ChinaRegionProvider);
  }
}

export default ChinaRegionPlugin;
