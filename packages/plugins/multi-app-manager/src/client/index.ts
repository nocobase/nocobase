import { Plugin } from '@nocobase/client';
import { MultiAppManagerProvider } from './MultiAppManagerProvider';
export { tableActionColumnSchema } from './settings/schemas/applications';

export class MultiAppManagerPlugin extends Plugin {
  async load() {
    this.app.use(MultiAppManagerProvider);
  }
}

export default MultiAppManagerPlugin;
