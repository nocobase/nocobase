/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { FullscreenPluginProvider } from './FullscreenPluginProvider';
import { importActionSchemaSettings } from './schemaSettings';

export class PluginActionBlockFullscreenClient extends Plugin {
  async load() {
    this.app.use(FullscreenPluginProvider);

    const initializerData = {
      type: 'item',
      name: 'blockFullscreen',
      Component: 'FullscreenActionInitializer',
      schema: {
        'x-align': 'right',
      },
    };

    const tableActionInitializers = this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializers?.add('enableActions.blockFullscreen', initializerData);
    this.app.schemaInitializerManager.addItem(
      'gantt:configureActions',
      'enableActions.blockFullscreen',
      initializerData,
    );
    this.app.schemaSettingsManager.add(importActionSchemaSettings);
  }
}

export default PluginActionBlockFullscreenClient;
