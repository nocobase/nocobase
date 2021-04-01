import path from 'path';
import { registerModels } from '@nocobase/database';
import { ChinaRegion } from './models/china-region';

export default async function (options = {}) {
  const { database } = this;
  registerModels({ ChinaRegion });
  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });
}
