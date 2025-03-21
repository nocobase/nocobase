/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { isURL, Registry } from '@nocobase/utils';

import { basename } from 'path';

import { Collection, Model, Transactionable } from '@nocobase/database';
import fs from 'fs';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';
import initActions from './actions';
import { getFileData } from './actions/attachments';
import { AttachmentInterface } from './interfaces/attachment-interface';
import { AttachmentModel, StorageClassType, StorageModel, StorageType } from './storages';
import StorageTypeAliOss from './storages/ali-oss';
import StorageTypeLocal from './storages/local';
import StorageTypeS3 from './storages/s3';
import StorageTypeTxCos from './storages/tx-cos';
import { encodeURL } from './utils';

export type * from './storages';

const DEFAULT_STORAGE_TYPE = STORAGE_TYPE_LOCAL;

class FileDeleteError extends Error {
  data: Model;

  constructor(message: string, data: Model) {
    super(message);
    this.name = 'FileDeleteError';
    this.data = data;
  }
}

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

export class PluginFileManagerServer extends Plugin {
  storageTypes = new Registry<StorageClassType>();
  storagesCache = new Map<number, StorageModel>();

  afterDestroy = async (record: Model, options) => {
    const { collection } = record.constructor as typeof Model;
    if (collection?.options?.template !== 'file' && collection.name !== 'attachments') {
      return;
    }

    if (!record.get('storageId')) {
      return;
    }

    const storage = this.storagesCache.get(record.get('storageId'));
    if (!storage) {
      return;
    }
    if (storage?.paranoid) {
      return;
    }
    const Type = this.storageTypes.get(storage.type);
    if (!Type) {
      return;
    }
    const storageConfig = new Type(storage);
    const result = await storageConfig.delete([record as unknown as AttachmentModel]);
    if (!result[0]) {
      throw new FileDeleteError('Failed to delete file', record);
    }
  };

  registerStorageType(type: string, Type: StorageClassType) {
    this.storageTypes.register(type, Type);
  }

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

  parseStorage(instance) {
    return this.app.environment.renderJsonTemplate(instance.toJSON());
  }

  async uploadFile(options: UploadFileOptions) {
    const { storageName, filePath, documentRoot } = options;
    const storageRepository = this.db.getRepository('storages');
    let storageInstance;

    storageInstance = await storageRepository.findOne({
      filter: storageName
        ? {
            name: storageName,
          }
        : {
            default: true,
          },
    });

    const fileStream = fs.createReadStream(filePath);

    if (!storageInstance) {
      throw new Error('[file-manager] no linked or default storage provided');
    }

    storageInstance = this.parseStorage(storageInstance);

    if (documentRoot) {
      storageInstance.options['documentRoot'] = documentRoot;
    }

    const storageType = this.storageTypes.get(storageInstance.type);
    const storage = new storageType(storageInstance);

    if (!storage) {
      throw new Error(`[file-manager] storage type "${storageInstance.type}" is not defined`);
    }

    const engine = storage.make();

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
      this.storagesCache.set(storage.get('id'), this.parseStorage(storage));
    }
  }

  async install() {
    const defaultStorageType = this.storageTypes.get(DEFAULT_STORAGE_TYPE);

    if (defaultStorageType) {
      const Storage = this.db.getCollection('storages');
      if (
        await Storage.repository.findOne({
          filter: {
            name: defaultStorageType.defaults().name,
          },
        })
      ) {
        return;
      }
      await Storage.repository.create({
        values: {
          ...defaultStorageType.defaults(),
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
        this.storagesCache.set(storage.id, this.parseStorage(storage));
      }
    }
    if (message.type === 'storageRemove') {
      const id = message.storageId;
      this.storagesCache.delete(id);
    }
  }

  async beforeLoad() {
    this.db.registerModels({ FileModel: Model });
    this.db.on('beforeDefineCollection', (options) => {
      if (options.template === 'file') {
        options.model = 'FileModel';
      }
    });
    this.db.on('afterDefineCollection', (collection: Collection) => {
      if (collection.options.template !== 'file') {
        return;
      }
      collection.model.beforeUpdate((model) => {
        if (!model.changed('url') || !model.changed('preview')) {
          return;
        }
        model.set('url', model.previous('url'));
        model.set('preview', model.previous('preview'));
        model.changed('url', false);
        model.changed('preview', false);
      });
    });
    this.app.on('afterStart', async () => {
      await this.loadStorages();
    });
  }

  async load() {
    this.db.on('afterDestroy', this.afterDestroy);

    this.storageTypes.register(STORAGE_TYPE_LOCAL, StorageTypeLocal);
    this.storageTypes.register(STORAGE_TYPE_ALI_OSS, StorageTypeAliOss);
    this.storageTypes.register(STORAGE_TYPE_S3, StorageTypeS3);
    this.storageTypes.register(STORAGE_TYPE_TX_COS, StorageTypeTxCos);

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
      for (const collection of this.db.collections.values()) {
        if (collection?.options?.template === 'file' && collection?.options?.storage === m.name) {
          throw new Error(
            this.t(
              `The storage "${m.name}" is in use in collection "${collection.name}" and cannot be deleted.`,
            ) as any,
          );
        }
      }
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

    initActions(this);

    this.app.acl.allow('attachments', ['upload', 'create'], 'loggedIn');
    this.app.acl.allow('storages', 'getBasicInfo', 'loggedIn');

    this.app.acl.appendStrategyResource('attachments');

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

    this.db.on('afterFind', async (instances) => {
      if (!instances) {
        return;
      }
      const records = Array.isArray(instances) ? instances : [instances];
      const name = records[0]?.constructor?.name;
      if (name) {
        const collection = this.db.getCollection(name);
        if (collection?.name === 'attachments' || collection?.options?.template === 'file') {
          for (const record of records) {
            const url = await this.getFileURL(record);
            const previewUrl = await this.getFileURL(record, true);
            record.set('url', url);
            record.set('preview', previewUrl);
            record.dataValues.preview = previewUrl; // 强制添加preview，在附件字段时，通过set设置无效
          }
        }
      }
    });
  }

  async getFileURL(file: AttachmentModel, preview = false) {
    if (!file.storageId) {
      return encodeURL(file.url);
    }
    const storage = this.storagesCache.get(file.storageId);
    if (!storage) {
      return encodeURL(file.url);
    }
    const storageType = this.storageTypes.get(storage.type);
    return new storageType(storage).getFileURL(file, preview ? storage.options.thumbnailRule : '');
  }
}

export default PluginFileManagerServer;
