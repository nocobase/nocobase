import path from 'path';
import Database, { registerModels } from '@nocobase/database';
import { ChinaRegion } from './models/china-region';
import Application from '@nocobase/server';

registerModels({ ChinaRegion });

export default async function (this: Application, options = {}) {
  const { db } = this;

  db.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.on('db.init', async () => {
    const M = db.getModel('china_regions');
    await M.importData();
  });
}
