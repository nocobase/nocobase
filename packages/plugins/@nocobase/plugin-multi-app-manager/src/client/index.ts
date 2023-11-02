import { Plugin } from '@nocobase/client';
import { MultiAppManagerProvider } from './MultiAppManagerProvider';

export class MultiAppManagerPlugin extends Plugin {
  async load() {
    this.app.use(MultiAppManagerProvider);
  }
}

export default MultiAppManagerPlugin;
export { formSchema, tableActionColumnSchema } from './settings/schemas/applications';
