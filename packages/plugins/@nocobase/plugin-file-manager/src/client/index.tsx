/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useCollection } from '@nocobase/client';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';
import { FileManagerProvider } from './FileManagerProvider';
import { FileSizeField } from './FileSizeField';
import { FileStoragePane } from './FileStorage';
import { useAttachmentFieldProps, useFileCollectionStorageRules } from './hooks';
import { useStorageCfg } from './hooks/useStorageUploadProps';
import { AttachmentFieldInterface } from './interfaces/attachment';
import { NAMESPACE } from './locale';
import { storageTypes } from './schemas/storageTypes';
import { FileCollectionTemplate } from './templates';

export class PluginFileManagerClient extends Plugin {
  // refer by plugin-field-attachment-url
  static buildInStorage = [STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS];
  storageTypes = new Map();

  async load() {
    this.app.dataSourceManager.addFieldInterfaces([AttachmentFieldInterface]);
    this.app.dataSourceManager.addCollectionTemplates([FileCollectionTemplate]);

    this.app.use(FileManagerProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("File manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileOutlined',
      Component: FileStoragePane,
      aclSnippet: 'pm.file-manager.storages',
    });
    Object.values(storageTypes).forEach((storageType) => {
      this.registerStorageType(storageType.name, storageType);
    });

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.upload', {
      title: "{{t('Upload')}}",
      Component: 'UploadActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible() {
        const collection = useCollection();
        return collection.template === 'file';
      },
    });

    this.app.addScopes({
      useAttachmentFieldProps,
      useFileCollectionStorageRules,
      useStorageCfg,
    });

    this.app.addComponents({
      FileSizeField,
    });
  }

  registerStorageType(name: string, options) {
    this.storageTypes.set(name, options);
  }

  getStorageType(name: string) {
    return this.storageTypes.get(name);
  }

  async uploadFile(options?: {
    file: File;
    fileCollectionName?: string;
    storageId?: string;
    storage?: any;
  }): Promise<{ errorMessage?: string; data?: any }> {
    // 1. If storage exists, call the upload method directly
    if (options.storage) {
      const storageConfig = options.storage;
      const storageType = this.getStorageType(storageConfig.type);
      return await storageType?.upload({ file: options.file, storageConfig, apiClient: this.app.apiClient });
    }

    // 2. Get storage by storageId, then call the upload method
    if (options?.storageId) {
      const storageConfig = await this.app.apiClient.resource('storages').get({
        filterByTk: options.storageId,
      });

      if (storageConfig) {
        const storageType = this.getStorageType(storageConfig.type);
        return await storageType?.upload({ file: options.file, storageConfig, apiClient: this.app.apiClient });
      }
    }

    // 3. Get storage by fileCollectionName, then call the upload method
    if (options?.fileCollectionName) {
      const fileCollection = this.app.getCollectionManager().getCollection(options.fileCollectionName);
      const storageId = fileCollection.getOption('storage');
      if (storageId) {
        const storageConfig = await this.app.apiClient.resource('storages').get({
          filterByTk: storageId,
        });

        if (storageConfig) {
          const storageType = this.getStorageType(storageConfig.type);
          return await storageType?.upload({
            file: options.file,
            storageConfig,
            fileCollectionName: options.fileCollectionName,
            apiClient: this.app.apiClient,
          });
        }
      }
    }

    // 4. Get the default storage, then call the upload method
    const { data }: any = await this.app.apiClient.resource('storages').get({
      filter: {
        default: true,
      },
    });
    const defaultStorage = data?.data;
    if (defaultStorage) {
      const storageType = this.getStorageType(defaultStorage.type);
      if (storageType?.upload) {
        return await storageType.upload({
          file: options.file,
          storageConfig: defaultStorage,
          apiClient: this.app.apiClient,
        });
      }
    }

    return {
      errorMessage: `{{ t("No storage found", { ns: "${NAMESPACE}" }) }}`,
    };
  }
}

export default PluginFileManagerClient;
