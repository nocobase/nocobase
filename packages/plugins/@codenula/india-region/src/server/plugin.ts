import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class IndiaRegionServer extends Plugin {
  async install() {
    await this.importData();
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.acl.allow('regions', 'list', 'loggedIn');

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action.params;

      if (resourceName == 'regions' && actionName !== 'list') {
        ctx.throw(404, 'Not Found');
      } else {
        await next();
      }
    });
  }

  async importData() {
    const regions = require(`./data/indianRegions.json`);

    const IndianRegion = this.db.getModel('regions');
    
    await IndianRegion.bulkCreate(
      regions.map((item) => ({
        code: item.code,
        name: item.name,
        level: item.level,
        parentCode: item.parentCode,
      })),
    );

    const count = await IndianRegion.count();
  }
}

export default IndiaRegionServer;
