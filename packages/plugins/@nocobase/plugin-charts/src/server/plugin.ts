import { InstallOptions, Plugin } from '@nocobase/server';
import JSON5 from 'json5';
import { resolve } from 'path';
import { getData, listMetadata, validate } from './actions/chartsQueries';
import { query } from './query';

export class ChartsPlugin extends Plugin {
  syncFields = async (instance, { transaction }) => {
    const _data = await query[instance.type](instance.options, { db: this.db, transaction, validateSQL: true });
    let data;
    if (typeof _data === 'string') {
      data = JSON5.parse(_data);
    } else {
      data = _data;
    }
    const d = Array.isArray(data) ? data?.[0] : data;
    const fields = Object.keys(d || {}).map((f) => {
      return {
        name: f,
      };
    });
    instance.set('fields', fields);
  };

  afterAdd() {}

  beforeLoad() {
    this.app.db.on('chartsQueries.beforeCreate', this.syncFields);
    this.app.db.on('chartsQueries.beforeUpdate', this.syncFields);
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));

    this.app.resourcer.registerActionHandlers({
      'chartsQueries:getData': getData,
      'chartsQueries:listMetadata': listMetadata,
      'chartsQueries:validate': validate,
    });

    this.app.acl.registerSnippet({
      name: 'pm.charts.queries',
      actions: ['chartsQueries:*'],
    });

    this.app.acl.allow('chartsQueries', 'getData', 'loggedIn');
    this.app.acl.allow('chartsQueries', 'listMetadata', 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ChartsPlugin;
