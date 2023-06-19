import { Plugin } from '@nocobase/client';
import { ChartsProvider } from './ChartsProvider';

export class ChartsPlugin extends Plugin {
  async load() {
    this.app.use(ChartsProvider);
  }
}

export default ChartsPlugin;
