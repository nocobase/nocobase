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
import { DisplayPreviewFieldModel } from './models/DisplayPreviewFieldModel';
import { UploadFieldModel } from './models/UploadFieldModel';
import { UploadActionModel } from './models/UploadActionModel';
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

    this.flowEngine.registerModels({ DisplayPreviewFieldModel, UploadActionModel, UploadFieldModel });
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
    storageId?: number;
    storageRules?: {
      size: number;
    };
    query?: Record<string, any>; // ⭐️ 新增可选 query 参数
  }): Promise<{ errorMessage?: string; data?: any }> {
    if (!options?.file) {
      return { errorMessage: 'Missing file' };
    }

    const { file, storageType, storageId, storageRules, query = {} } = options;
    const fileCollectionName = options?.fileCollectionName || 'attachments';

    const storageTypeObj = this.getStorageType(storageType);

    // 1. storageType 自定义上传
    if (storageTypeObj?.upload) {
      return await storageTypeObj.upload({
        file,
        apiClient: this.app.apiClient,
        storageType,
        storageId,
        storageRules,
        fileCollectionName,
        query,
      });
    }

    // 2. 默认上传 —— 拼接 URL 参数
    try {
      const formData = new FormData();
      formData.append('file', file);

      /** ⭐️ 拼接 URL 查询参数 */
      const queryString = new URLSearchParams(query).toString();
      const url = queryString ? `${fileCollectionName}:create?${queryString}` : `${fileCollectionName}:create`;

      const res = await this.app.apiClient.request({
        url,
        method: 'post',
        data: formData,
      });

      return { data: res.data?.data };
    } catch (error: any) {
      return {
        errorMessage: error?.message ?? 'Upload failed',
      };
    }
  }
}

export { filePreviewTypes, wrapWithModalPreviewer } from './previewer/filePreviewTypes';
export type { FilePreviewType, FilePreviewerProps } from './previewer/filePreviewTypes';
export { CardUpload, UploadFieldModel } from './models/UploadFieldModel';

export default PluginFileManagerClient;
