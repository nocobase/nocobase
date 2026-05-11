/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';
import { NAMESPACE } from '../common/constants';
// Side-effect import: registers the four built-in storage forms into
// `storageFormRegistry`. Commercial / third-party plugins that ship their own
// storage types call `storageFormRegistry.register(...)` from their own
// plugin entry to extend the dropdown.
import './storage-forms';

type UploadFileResult = {
  errorMessage?: string;
  data?: unknown;
};

type StorageUploadOptions = {
  file: File;
  apiClient: Application['apiClient'];
  storageType?: string;
  storageId?: number;
  storageRules?: {
    size?: number;
    mimetype?: string | string[];
  };
  fileCollectionName: string;
  query?: Record<string, string | number | boolean>;
};

/**
 * Runtime extension point for storage types — separate from the settings-page
 * `storageFormRegistry`. Plugins providing a custom upload pipeline (e.g.
 * S3 Pro's direct-to-bucket presigned-URL flow) register an entry here so
 * `UploadFieldModel` / `UploadActionModel` can bypass the default
 * `apiClient.request` upload path.
 */
export interface StorageTypeRuntime {
  name: string;
  upload?: (options: StorageUploadOptions) => Promise<UploadFileResult>;
  createUploadCustomRequest?: (options: any) => (option: any) => void;
}

export class PluginFileManagerClientV2 extends Plugin<Record<string, never>, Application> {
  // refer by plugin-field-attachment-url
  static buildInStorage = [STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS];

  storageTypes = new Map<string, StorageTypeRuntime>();

  async load() {
    const title = this.app.i18n.t('File manager', { ns: NAMESPACE });

    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title,
      icon: 'FileOutlined',
      aclSnippet: 'pm.file-manager.storages',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title,
      componentLoader: () => import('./pages/FileStoragePage'),
    });

    this.flowEngine.registerModelLoaders({
      DisplayPreviewFieldModel: {
        loader: () => import('./models/DisplayPreviewFieldModel'),
      },
      UploadActionModel: {
        loader: () => import('./models/UploadActionModel'),
      },
      UploadFieldModel: {
        loader: () => import('./models/UploadFieldModel'),
      },
    });
  }

  registerStorageType(name: string, options: StorageTypeRuntime) {
    this.storageTypes.set(name, options);
  }

  getStorageType(name?: string) {
    return name ? this.storageTypes.get(name) : undefined;
  }

  async uploadFile(options?: {
    file: File;
    fileCollectionName?: string;
    storageType?: string;
    storageId?: number;
    storageRules?: StorageUploadOptions['storageRules'];
    query?: StorageUploadOptions['query'];
  }): Promise<UploadFileResult> {
    if (!options?.file) {
      return { errorMessage: 'Missing file' };
    }

    const { file, storageType, storageId, storageRules, query = {} } = options;
    const fileCollectionName = options.fileCollectionName || 'attachments';
    const storageTypeObject = this.getStorageType(storageType);

    if (storageTypeObject?.upload) {
      return await storageTypeObject.upload({
        file,
        apiClient: this.app.apiClient,
        storageType,
        storageId,
        storageRules,
        fileCollectionName,
        query,
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const queryString = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)]),
      ).toString();
      const url = queryString ? `${fileCollectionName}:create?${queryString}` : `${fileCollectionName}:create`;

      const response = await this.app.apiClient.request({
        url,
        method: 'post',
        data: formData,
      });

      return { data: response.data?.data };
    } catch (error) {
      return {
        errorMessage: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}

export default PluginFileManagerClientV2;
