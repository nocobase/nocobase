/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useActionAvailable } from '@nocobase/client';
import { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings } from './BulkUpdateAction.Settings';
import { BulkUpdateActionInitializer } from './BulkUpdateActionInitializer';
import { CustomizeActionInitializer } from './CustomizeActionInitializer';
import { useCustomizeBulkUpdateActionProps } from './utils';
export class PluginActionBulkUpdateClient extends Plugin {
  async load() {
    this.app.addComponents({ CustomizeActionInitializer });
    this.app.addScopes({ useCustomizeBulkUpdateActionProps });
    this.app.schemaSettingsManager.add(deprecatedBulkUpdateActionSettings);
    this.app.schemaSettingsManager.add(bulkUpdateActionSettings);

    const initializerData = {
      title: '{{t("Bulk update")}}',
      Component: BulkUpdateActionInitializer,
      name: 'bulkUpdate',
      useVisible: () => useActionAvailable('updateMany'),
    };

    this.app.schemaInitializerManager.addItem('table:configureActions', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('gantt:configureActions', 'customize.bulkUpdate', initializerData);
    this.app.schemaInitializerManager.addItem('map:configureActions', 'customize.bulkUpdate', initializerData);
  }
}

export default PluginActionBulkUpdateClient;
