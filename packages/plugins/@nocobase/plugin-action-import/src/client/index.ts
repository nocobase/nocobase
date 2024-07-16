/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// i18n.addResources('zh-CN', NAMESPACE, zhCN);
// i18n.addResources('en-US', NAMESPACE, enUS);

export * from './ImportActionInitializer';
export * from './ImportDesigner';
export * from './ImportPluginProvider';
export * from './useImportAction';

import { Plugin, useCollection_deprecated } from '@nocobase/client';
import { ImportPluginProvider } from './ImportPluginProvider';
import { importActionSchemaSettings } from './schemaSettings';

export class PluginActionImportClient extends Plugin {
  async load() {
    this.app.use(ImportPluginProvider);

    const initializerData = {
      title: "{{t('Import')}}",
      Component: 'ImportActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action': 'importXlsx',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible() {
        const collection = useCollection_deprecated() || ({} as any);
        const { unavailableActions, availableActions } = collection;
        if (availableActions) {
          return availableActions.includes?.('create');
        }
        if (unavailableActions) {
          return !unavailableActions?.includes?.('create');
        }
        return true;
      },
    };

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.import', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'enableActions.import', initializerData);
    this.app.schemaSettingsManager.add(importActionSchemaSettings);
  }
}

export default PluginActionImportClient;
