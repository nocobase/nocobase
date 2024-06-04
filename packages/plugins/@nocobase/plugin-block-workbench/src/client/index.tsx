/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { WorkbenchBlock } from './WorkbenchBlock';
import { workbenchActionSettingsLink } from './WorkbenchLinkActionSchemaInitializerItem';
import { workbenchActionSettingsScanQrCode } from './WorkbenchScanActionSchemaInitializerItem';
import { workbenchBlockInitializerItem } from './workbenchBlockInitializerItem';
import { workbenchBlockSettings } from './workbenchBlockSettings';
import { workbenchConfigureActions } from './workbenchConfigureActions';

export class PluginBlockWorkbenchClient extends Plugin {
  async load() {
    this.app.addComponents({ WorkbenchBlock });
    this.app.schemaSettingsManager.add(workbenchBlockSettings);
    this.app.schemaSettingsManager.add(workbenchActionSettingsLink);
    this.app.schemaSettingsManager.add(workbenchActionSettingsScanQrCode);
    this.app.schemaInitializerManager.add(workbenchConfigureActions);
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      `otherBlocks.${workbenchBlockInitializerItem.name}`,
      workbenchBlockInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'mobilePage:addBlock',
      `otherBlocks.${workbenchBlockInitializerItem.name}`,
      workbenchBlockInitializerItem,
    );
  }
}

export default PluginBlockWorkbenchClient;
