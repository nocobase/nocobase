import { InstallOptions, Plugin } from '@nocobase/server';
import { routes } from './routes';

export class MobileClientPlugin extends Plugin {
  afterAdd() {}

  async load() {}

  async install() {
    const repository = this.app.db.getRepository('uiRoutes');
    for (const values of routes) {
      await repository.create({
        values,
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default MobileClientPlugin;
