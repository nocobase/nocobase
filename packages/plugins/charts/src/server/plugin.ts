import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { getData, listSchema } from './actions/chartsQueries';
import { query } from './query';

export class ChartsPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  syncFields = async (instance, { transaction }) => {
    const data = await query[instance.type](instance.options, { db: this.db, transaction });
    const d = Array.isArray(data) ? data?.[0] : data;
    const fields = Object.keys(d || {}).map((f) => {
      return {
        name: f,
      };
    });
    instance.set('fields', fields);
  };

  async load() {
    this.app.resourcer.registerActionHandlers({
      'chartsQueries:getData': getData,
      'chartsQueries:listSchema': listSchema,
    });
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
    this.app.db.on('chartsQueries.beforeCreate', this.syncFields);
    this.app.db.on('chartsQueries.beforeUpdate', this.syncFields);
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ChartsPlugin;
