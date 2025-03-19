/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useCollection } from '@nocobase/client';
import { FileManagerProvider } from './FileManagerProvider';
import { FileStoragePane } from './FileStorage';
import { NAMESPACE } from './locale';
import { storageTypes } from './schemas/storageTypes';
import { AttachmentFieldInterface } from './interfaces/attachment';
import { FileCollectionTemplate } from './templates';
import { useAttachmentFieldProps, useFileCollectionStorageRules } from './hooks';
import { FileSizeField } from './FileSizeField';
import { STORAGE_TYPE_ALI_OSS, STORAGE_TYPE_LOCAL, STORAGE_TYPE_S3, STORAGE_TYPE_TX_COS } from '../constants';

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
}

export default PluginFileManagerClient;
