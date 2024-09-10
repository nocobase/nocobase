/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import { basename, resolve } from 'path';

import { Transactionable } from '@nocobase/database';
import fs from 'fs';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';
import { FileModel } from './FileModel';
import initActions from './actions';
import { getFileData } from './actions/attachments';
import { AttachmentInterface } from './interfaces/attachment-interface';
import { IStorage, StorageModel } from './storages';
import StorageTypeAliOss from './storages/ali-oss';
import StorageTypeLocal from './storages/local';
import StorageTypeS3 from './storages/s3';
import StorageTypeTxCos from './storages/tx-cos';

export type * from './storages';

const DEFAULT_STORAGE_TYPE = STORAGE_TYPE_LOCAL;

export type FileRecordOptions = {
  collectionName: string;
  filePath: string;
  storageName?: string;
  values?: any;
} & Transactionable;

export type UploadFileOptions = {
  filePath: string;
  storageName?: string;
  documentRoot?: string;
};

export default class PluginFileManagerServer extends Plugin {
  storageTypes = new Registry<IStorage>();
  storagesCache = new Map<number, StorageModel>();

  async createFileRecord(options: FileRecordOptions) {
    const { values, storageName, collectionName, filePath, transaction } = options;
    const collection = this.db.getCollection(collectionName);
    if (!collection) {
      throw new Error(`collection does not exist`);
    }
    const collectionRepository = this.db.getRepository(collectionName);
    const name = storageName || collection.options.storage;
    const data = await this.uploadFile({ storageName: name, filePath });
    return await collectionRepository.create({ values: { ...data, ...values }, transaction });
  }

  async uploadFile(options: UploadFileOptions) {
    const { storageName, filePath, documentRoot } = options;
    const storageRepository = this.db.getRepository('storages');
    let storageInstance;

    if (storageName) {
      storageInstance = await storageRepository.findOne({
        filter: {
          name: storageName,
        },
      });
    }

    if (!storageInstance) {
      storageInstance = await storageRepository.findOne({
        filter: {
          default: true,
        },
      });
    }

    const fileStream = fs.createReadStream(filePath);

    if (!storageInstance) {
      throw new Error('[file-manager] no linked or default storage provided');
    }

    if (documentRoot) {
      storageInstance.options['documentRoot'] = documentRoot;
    }

    const storageConfig = this.storageTypes.get(storageInstance.type);

    if (!storageConfig) {
      throw new Error(`[file-manager] storage type "${storageInstance.type}" is not defined`);
    }

    const engine = storageConfig.make(storageInstance);

    const file = {
      originalname: basename(filePath),
      path: filePath,
      stream: fileStream,
    } as any;

    await new Promise((resolve, reject) => {
      engine._handleFile({} as any, file, (error, info) => {
        if (error) {
          reject(error);
        }
        Object.assign(file, info);
        resolve(info);
      });
    });

    return getFileData({ app: this.app, file, storage: storageInstance, request: { body: {} } } as any);
  }

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

  async handleSyncMessage(message) {
    if (message.type === 'storageChange') {
      const storage = await this.db.getRepository('storages').findOne({
        filterByTk: message.storageId,
      });
      if (storage) {
        this.storagesCache.set(storage.id, storage.toJSON());
      }
    }
    if (message.type === 'storageRemove') {
      const id = message.storageId;
      this.storagesCache.delete(id);
    }
  }

  async beforeLoad() {
    this.db.registerModels({ FileModel });
    this.db.on('beforeDefineCollection', (options) => {
      if (options.template === 'file') {
        options.model = 'FileModel';
      }
    });
    this.app.on('afterStart', async () => {
      await this.loadStorages();
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
    Storage.afterSave((m, { transaction }) => {
      this.storagesCache.set(m.id, m.toJSON());
      this.sendSyncMessage(
        {
          type: 'storageChange',
          storageId: m.id,
        },
        { transaction },
      );
    });
    Storage.afterDestroy((m, { transaction }) => {
      this.storagesCache.delete(m.id);
      this.sendSyncMessage(
        {
          type: 'storageRemove',
          storageId: m.id,
        },
        { transaction },
      );
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
