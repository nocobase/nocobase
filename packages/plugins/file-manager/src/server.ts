import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { action as uploadAction, middleware as uploadMiddleware } from './actions/upload';
import { STORAGE_TYPE_LOCAL } from './constants';
import { getStorageConfig } from './storages';

export default class PluginFileManager extends Plugin {
  storageType() {
    return process.env.DEFAULT_STORAGE_TYPE;
  }

  async install() {
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
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    // 暂时中间件只能通过 use 加进来
    this.app.resourcer.use(uploadMiddleware);
    this.app.resourcer.registerActionHandler('upload', uploadAction);

    if (process.env.NOCOBASE_ENV !== 'production') {
      await getStorageConfig(STORAGE_TYPE_LOCAL).middleware(this.app);
    }

    this.app.resourcer.addParamsMerger('storages:destroy', () => {
      return {
        filter: {
          $and: [{ 'name.$ne': 'local' }],
        },
      };
    });

    const ownMerger = (ctx) => {
      return {
        filter: {
          createdById: ctx.state.currentUser.id,
        },
      };
    };

    this.app.resourcer.addParamsMerger('attachments:update', ownMerger);
    this.app.resourcer.addParamsMerger('attachments:create', ownMerger);
    this.app.resourcer.addParamsMerger('attachments:destroy', ownMerger);

    this.app.acl.allow('storages', ['create', 'update', 'destroy'], 'allowConfigure');
    this.app.acl.allow('attachments', 'upload', 'loggedIn');
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
