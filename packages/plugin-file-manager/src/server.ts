import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import { PluginOptions, Plugin } from '@nocobase/server';

import {
  action as uploadAction,
  middleware as uploadMiddleware,
} from './actions/upload';
import {
  middleware as localMiddleware,
} from './storages/local';

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
    localMiddleware(this.app);
  
    const Storage = database.getModel('storages');
  
    this.app.on('db.init', async () => {
      await Storage.create({
        title: '本地存储',
        name: `local`,
        type: 'local',
        baseUrl: process.env.LOCAL_STORAGE_BASE_URL,
        default: process.env.STORAGE_TYPE === 'local',
      });
      await Storage.create({
        name: `ali-oss`,
        type: 'ali-oss',
        baseUrl: process.env.ALI_OSS_STORAGE_BASE_URL,
        options: {
          region: process.env.ALI_OSS_REGION,
          accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
          accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
          bucket: process.env.ALI_OSS_BUCKET,
        },
        default: process.env.STORAGE_TYPE === 'ali-oss',
      });
    });
  },
} as PluginOptions;
