import database from './database';
import plugins from './plugins';
import resourcer from './resourcer';
import cache from './cache';
import path from 'path';

const basePath = path.resolve(__dirname, '../../../../../');

export default {
  database,
  resourcer,
  plugins,
  cache,
  basePath,
};
