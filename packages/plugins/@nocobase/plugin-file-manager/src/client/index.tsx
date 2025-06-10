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
    storageType?: string;
    /** 后面可能会废弃这个参数 */
    storageId?: number;
    storageRules?: {
      size: number;
    };
  }): Promise<{ errorMessage?: string; data?: any }> {
    const storageTypeObj = this.getStorageType(options?.storageType);
    if (storageTypeObj?.upload) {
      // 1. If storageType is provided, call the upload method directly
      return await storageTypeObj.upload({
        file: options.file,
        apiClient: this.app.apiClient,
        storageType: options.storageType,
        storageId: options.storageId,
        storageRules: options.storageRules,
        fileCollectionName: options.fileCollectionName,
      });
    }

    // 2. If storageType is not provided, use the default upload method
    try {
      const formData = new FormData();
      formData.append('file', options.file);
      const res = await this.app.apiClient.request({
        url: `${options.fileCollectionName || 'attachments'}:create`,
        method: 'post',
        data: formData,
      });

      return {
        data: res.data?.data,
      };
    } catch (error) {
      return {
        errorMessage: error.message,
      };
    }
  }
}

export default PluginFileManagerClient;
