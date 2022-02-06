import path from 'path';
import { Plugin } from '@nocobase/server';

import { action as uploadAction, middleware as uploadMiddleware } from './actions/upload';
import { getStorageConfig } from './storages';
import { STORAGE_TYPE_LOCAL } from './constants';

export default class PluginFileManager extends Plugin {
  storageType() {
    return process.env.DEFAULT_STORAGE_TYPE;
  }
  async beforeLoad() {
    this.app.on('installing', async () => {
      const defaultStorageConfig = getStorageConfig(this.storageType());
      if (defaultStorageConfig) {
        const Storage = this.db.getCollection('storages');
        await Storage.repository.create({
          values: {
            ...defaultStorageConfig.defaults(),
            type: this.storageType(),
            default: true,
          },
        });
      }
    });
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    // 暂时中间件只能通过 use 加进来
    this.app.resourcer.use(uploadMiddleware);
    this.app.resourcer.registerActionHandler('upload', uploadAction);

    if (process.env.NOCOBASE_ENV !== 'production') {
      await getStorageConfig(STORAGE_TYPE_LOCAL).middleware(this.app);
    }
  }
}
