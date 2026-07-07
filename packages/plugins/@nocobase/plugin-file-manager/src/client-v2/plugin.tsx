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
import type React from 'react';
import {
  FILE_SIZE_LIMIT_DEFAULT,
  STORAGE_TYPE_ALI_OSS,
  STORAGE_TYPE_LOCAL,
  STORAGE_TYPE_S3,
  STORAGE_TYPE_TX_COS,
} from '../constants';
import { NAMESPACE } from '../common/constants';
import { AttachmentFieldInterface } from './interfaces/attachment';
import { tExpr } from './locale';

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
  dataSourceKey?: string;
  fileCollectionName: string;
  query?: Record<string, string | number | boolean>;
};

/**
 * Unified storage type definition. A single entry describes both the
 * settings-page form (UI: `title` + `formLoader` + `defaultValues`) and the
 * optional runtime upload override (`upload` / `createUploadCustomRequest`).
 *
 * Built-in storages register the UI fields only and fall back to the default
 * `apiClient.request` multipart upload. Commercial / third-party storage
 * plugins (e.g. S3 Pro) layer a presigned-PUT pipeline on top by populating
 * the optional runtime fields.
 */
export interface StorageType {
  /** Server-side storage type identifier — must match the persisted `storages.type` value. */
  name: string;
  /** Display title shown in the "Add new" dropdown and drawer header. Wrapped with `t(...)` at render time. */
  title: string;
  /**
   * Async loader for the form body — the list of `<Form.Item>` fields inside
   * the storage drawer. The loaded module's default export is used, matching
   * the convention of `componentLoader` and `registerModelLoaders` elsewhere
   * in the codebase.
   */
  formLoader: () => Promise<{ default: React.ComponentType }>;
  /**
   * Optional per-storage initial values merged on top of the page-level
   * defaults (`type` + generated `name`) when creating a new record.
   */
  defaultValues?: Record<string, any>;
  /**
   * Optional override of the `PluginFileManagerClientV2.uploadFile` pipeline,
   * used when editors (Markdown, Vditor, etc.) paste / drop files outside of
   * an attachment field. When absent, uploads go through the default
   * multipart `apiClient.request` path.
   */
  upload?: (options: StorageUploadOptions) => Promise<UploadFileResult>;
  /**
   * Optional `customRequest` factory consumed by `UploadFieldModel` for the
   * inline attachment Upload component. When absent, `UploadFieldModel` falls
   * back to `uploadFile`.
   */
  createUploadCustomRequest?: (options: any) => (option: any) => void;
}

export class PluginFileManagerClientV2 extends Plugin<Record<string, never>, Application> {
  // refer by plugin-field-attachment-url
  static buildInStorage = [STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS];

  storageTypes = new Map<string, StorageType>();

  async load() {
    this.app.addFieldInterfaces([AttachmentFieldInterface]);

    const title = this.app.i18n.t('File manager', { ns: NAMESPACE });
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as
      | {
          registerCollectionTemplate?: (options: Record<string, unknown>) => void;
        }
      | undefined;
    dataSourceManager?.registerCollectionTemplate?.({
      name: 'file',
      title: tExpr('File collection'),
      order: 25,
      color: 'blue',
      collection: {
        options: {
          template: 'file',
          createdBy: true,
          updatedBy: true,
        },
        fields: [
          {
            name: 'title',
            interface: 'input',
            type: 'string',
            title: tExpr('Title'),
            deletable: false,
          },
          {
            name: 'filename',
            interface: 'input',
            type: 'string',
            title: tExpr('File name'),
            deletable: false,
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'extname',
            interface: 'input',
            type: 'string',
            title: tExpr('Extension name'),
            deletable: false,
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'size',
            interface: 'integer',
            type: 'integer',
            title: tExpr('Size'),
            deletable: false,
            componentProps: {
              stringMode: true,
              step: '0',
            },
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'mimetype',
            interface: 'input',
            type: 'string',
            title: tExpr('MIME type'),
            deletable: false,
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'path',
            interface: 'textarea',
            type: 'text',
            title: tExpr('Path'),
            deletable: false,
            component: 'TextAreaWithGlobalScope',
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'url',
            interface: 'url',
            type: 'text',
            title: tExpr('URL'),
            deletable: false,
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'preview',
            interface: 'url',
            type: 'text',
            title: tExpr('Preview'),
            field: 'url',
            deletable: false,
            component: 'Preview',
            uiSchema: {
              'x-read-pretty': true,
            },
          },
          {
            name: 'storage',
            interface: 'm2o',
            type: 'belongsTo',
            title: tExpr('Storage'),
            target: 'storages',
            foreignKey: 'storageId',
            deletable: false,
            componentProps: {
              fieldNames: {
                value: 'id',
                label: 'title',
              },
            },
            uiSchema: {
              type: 'object',
              'x-read-pretty': true,
            },
          },
          {
            name: 'meta',
            interface: 'json',
            type: 'jsonb',
            defaultValue: {},
            deletable: false,
          },
        ],
      },
      presetFields: {
        disabled: true,
      },
    });

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

    this.registerBuiltInStorageTypes();

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

  registerStorageType(name: string, storageType: Omit<StorageType, 'name'>) {
    this.storageTypes.set(name, { ...storageType, name });
  }

  getStorageType(name?: string) {
    return name ? this.storageTypes.get(name) : undefined;
  }

  private registerBuiltInStorageTypes() {
    const commonDefaults = {
      renameMode: 'appendRandomID',
      rules: { size: FILE_SIZE_LIMIT_DEFAULT },
    };
    this.registerStorageType(STORAGE_TYPE_LOCAL, {
      title: 'Local storage',
      formLoader: () => import('./storage-forms/LocalStorageForm'),
      defaultValues: {
        ...commonDefaults,
        baseUrl: '/storage/uploads',
        options: { documentRoot: 'storage/uploads' },
      },
    });
    this.registerStorageType(STORAGE_TYPE_ALI_OSS, {
      title: 'Aliyun OSS',
      formLoader: () => import('./storage-forms/AliOssStorageForm'),
      defaultValues: {
        ...commonDefaults,
        options: { timeout: 600_000 },
        settings: { requestOptions: {} },
      },
    });
    this.registerStorageType(STORAGE_TYPE_S3, {
      title: 'Amazon S3',
      formLoader: () => import('./storage-forms/S3StorageForm'),
      defaultValues: commonDefaults,
    });
    this.registerStorageType(STORAGE_TYPE_TX_COS, {
      title: 'Tencent COS',
      formLoader: () => import('./storage-forms/TxCosStorageForm'),
      defaultValues: commonDefaults,
    });
  }

  async uploadFile(options?: {
    file: File;
    fileCollectionName?: string;
    storageType?: string;
    storageId?: number;
    storageRules?: StorageUploadOptions['storageRules'];
    dataSourceKey?: string;
    query?: StorageUploadOptions['query'];
  }): Promise<UploadFileResult> {
    if (!options?.file) {
      return { errorMessage: 'Missing file' };
    }

    const { file, storageType, storageId, storageRules, dataSourceKey, query = {} } = options;
    const fileCollectionName = options.fileCollectionName || 'attachments';
    const storageTypeObject = this.getStorageType(storageType);
    const uploadQuery = {
      ...query,
      ...(dataSourceKey && dataSourceKey !== 'main' ? { uploadDataSourceKey: dataSourceKey } : {}),
    };

    if (storageTypeObject?.upload) {
      return await storageTypeObject.upload({
        file,
        apiClient: this.app.apiClient,
        storageType,
        storageId,
        storageRules,
        dataSourceKey,
        fileCollectionName,
        query: uploadQuery,
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const queryString = new URLSearchParams(
        Object.entries(uploadQuery).map(([key, value]) => [key, String(value)]),
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
