import path from 'path';
import { registerModels } from '@nocobase/database';
import { ChinaRegion } from './models/china-region';
import { Plugin } from '@nocobase/server';

registerModels({ ChinaRegion });

export default {
  name: 'china-region',
  async load(this: Plugin) {
    const db = this.app.db;
  
    db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  
    this.app.on('db.init', async () => {
      const M = db.getModel('china_regions');
      await M.importData();
    });
  }
};
