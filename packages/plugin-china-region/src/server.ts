import path from 'path';
import Database, { registerModels } from '@nocobase/database';
import { ChinaRegion } from './models/china-region';
import Application from '@nocobase/server';

registerModels({ ChinaRegion });

export default async function (this: Application, options = {}) {
  const { database } = this;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.on('china-region.init', async () => {
    const M = database.getModel('china_regions');
    await M.importData();
  });
}
