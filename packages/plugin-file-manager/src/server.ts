import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { PluginOptions } from '@nocobase/server';

import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions/upload';
import { getStorageConfig } from './storages';
import { STORAGE_TYPE_LOCAL } from './constants';

export default {
  name: 'file-manager',
  async load() {
    const database: Database = this.app.db;
    const resourcer: Resourcer = this.app.resourcer;
  
    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });
  
    // 暂时中间件只能通过 use 加进来
    resourcer.use(uploadMiddleware);
    resourcer.registerActionHandler('upload', uploadAction);

    const { DEFAULT_STORAGE_TYPE } = process.env;

    if (process.env.NOCOBASE_ENV !== 'production'
      && DEFAULT_STORAGE_TYPE === STORAGE_TYPE_LOCAL
      && process.env.LOCAL_STORAGE_USE_STATIC_SERVER
    ) {
      await getStorageConfig(STORAGE_TYPE_LOCAL).middleware(this.app);
    }
    
    this.app.on('db.init', async () => {
      const defaultStorageConfig = getStorageConfig(DEFAULT_STORAGE_TYPE);
      if (defaultStorageConfig) {
        const StorageModel = database.getModel('storages');
        await StorageModel.create({
          ...defaultStorageConfig.defaults(),
          type: DEFAULT_STORAGE_TYPE,
          default: true
        });
      }
    });
  },
} as PluginOptions;
