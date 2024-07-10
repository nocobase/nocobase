/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'path';

import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import { FileModel } from './FileModel';
import initActions from './actions';
import { IStorage, StorageModel } from './storages';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';
import StorageTypeLocal from './storages/local';
import StorageTypeAliOss from './storages/ali-oss';
import StorageTypeS3 from './storages/s3';
import StorageTypeTxCos from './storages/tx-cos';
import { AttachmentInterface } from './interfaces/attachment-interface';

export type * from './storages';

const DEFAULT_STORAGE_TYPE = STORAGE_TYPE_LOCAL;

export default class PluginFileManagerServer extends Plugin {
  storageTypes = new Registry<IStorage>();
  storagesCache = new Map<number, StorageModel>();

  async loadStorages(options?: { transaction: any }) {
    const repository = this.db.getRepository('storages');
    const storages = await repository.find({
      transaction: options?.transaction,
    });
    this.storagesCache = new Map();
    for (const storage of storages) {
      this.storagesCache.set(storage.get('id'), storage.toJSON());
    }
    this.db['_fileStorages'] = this.storagesCache;
  }

  async install() {
    const defaultStorageConfig = this.storageTypes.get(DEFAULT_STORAGE_TYPE);

    if (defaultStorageConfig) {
      const Storage = this.db.getCollection('storages');
      if (
        await Storage.repository.findOne({
          filter: {
            name: defaultStorageConfig.defaults().name,
          },
        })
      ) {
        return;
      }
      await Storage.repository.create({
        values: {
          ...defaultStorageConfig.defaults(),
          type: DEFAULT_STORAGE_TYPE,
          default: true,
        },
      });
    }
  }

  private onSync = async (message) => {
    if (message.type === 'storageChange') {
      const storage = await this.db.getRepository('storages').findOne({
        filterByTk: message.storageId,
      });
      if (storage) {
        this.storagesCache.set(storage.id, storage.toJSON());
      }
    }
    if (message.type === 'storageRemove') {
      const id = Number.parseInt(message.storageId, 10);
      this.storagesCache.delete(id);
    }
  };

  async beforeLoad() {
    this.db.registerModels({ FileModel });
    this.db.on('beforeDefineCollection', (options) => {
      if (options.template === 'file') {
        options.model = 'FileModel';
      }
    });
    this.app.on('afterStart', async () => {
      await this.loadStorages();

      this.app.syncManager.subscribe(this.name, this.onSync);
    });
  }

  async load() {
    this.storageTypes.register(STORAGE_TYPE_LOCAL, new StorageTypeLocal());
    this.storageTypes.register(STORAGE_TYPE_ALI_OSS, new StorageTypeAliOss());
    this.storageTypes.register(STORAGE_TYPE_S3, new StorageTypeS3());
    this.storageTypes.register(STORAGE_TYPE_TX_COS, new StorageTypeTxCos());

    await this.db.import({
      directory: resolve(__dirname, './collections'),
    });

    const Storage = this.db.getModel('storages');
    Storage.afterSave((m) => {
      this.storagesCache.set(m.id, m.toJSON());
      this.app.syncManager.publish(this.name, {
        type: 'storageChange',
        storageId: `${m.id}`,
      });
    });
    Storage.afterDestroy((m) => {
      this.storagesCache.delete(m.id);
      this.app.syncManager.publish(this.name, {
        type: 'storageRemove',
        storageId: `${m.id}`,
      });
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.storages`,
      actions: ['storages:*'],
    });

    this.db.addMigrations({
      namespace: 'file-manager',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    initActions(this);

    this.app.acl.allow('attachments', 'upload', 'loggedIn');
    this.app.acl.allow('attachments', 'create', 'loggedIn');
    this.app.acl.allow('storages', 'getRules', 'loggedIn');

    // this.app.resourcer.use(uploadMiddleware);
    // this.app.resourcer.use(createAction);
    // this.app.resourcer.registerActionHandler('upload', uploadAction);

    const defaultStorageName = this.storageTypes.get(DEFAULT_STORAGE_TYPE).defaults().name;

    this.app.acl.addFixedParams('storages', 'destroy', () => {
      return {
        filter: { 'name.$ne': defaultStorageName },
      };
    });

    const ownMerger = () => {
      return {
        filter: {
          createdById: '{{ctx.state.currentUser.id}}',
        },
      };
    };

    this.app.acl.addFixedParams('attachments', 'update', ownMerger);
    this.app.acl.addFixedParams('attachments', 'create', ownMerger);
    this.app.acl.addFixedParams('attachments', 'destroy', ownMerger);

    this.app.db.interfaceManager.registerInterfaceType('attachment', AttachmentInterface);
  }
}
