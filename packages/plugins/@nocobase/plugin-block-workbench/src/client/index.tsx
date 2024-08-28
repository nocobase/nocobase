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
import {
  WorkbenchScanActionSchemaInitializerItem,
  workbenchActionSettingsScanQrCode,
} from './WorkbenchScanActionSchemaInitializerItem';
import { QRCodeScanner } from './components/qrcode-scanner';
import { workbenchBlockInitializerItem } from './workbenchBlockInitializerItem';
import { workbenchBlockSettings } from './workbenchBlockSettings';
import { workbenchConfigureActions } from './workbenchConfigureActions';
import {
  WorkbenchPopupActionSchemaInitializerItem,
  workbenchActionSettingsPopup,
} from './WorkbenchPopupActionSchemaInitializerItem';

import {
  WorkbenchCustomRequestActionSchemaInitializerItem,
  workbenchActionSettingsCustomRequest,
} from './WorkbenchCustomRequestActionSchemaInitializerItem';
export class PluginBlockWorkbenchClient extends Plugin {
  async load() {
    this.app.addComponents({ WorkbenchBlock, QRCodeScanner });

    // 新增工作台区块的设置器
    this.app.schemaSettingsManager.add(workbenchBlockSettings);

    // 工作台的配置操作埋点
    this.app.schemaInitializerManager.add(workbenchConfigureActions);

    // 添加到页面的 Add block 里
    this.app.schemaInitializerManager.addItem(
      'page:addBlock',
      `otherBlocks.${workbenchBlockInitializerItem.name}`,
      workbenchBlockInitializerItem,
    );

    // 添加到移动端的 Add block 里
    this.app.schemaInitializerManager.addItem(
      'mobilePage:addBlock',
      `otherBlocks.${workbenchBlockInitializerItem.name}`,
      workbenchBlockInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'mobile:addBlock',
      `otherBlocks.${workbenchBlockInitializerItem.name}`,
      workbenchBlockInitializerItem,
    );

    // link 操作
    this.app.schemaSettingsManager.add(workbenchActionSettingsLink);

    // 扫码操作
    this.app.schemaSettingsManager.add(workbenchActionSettingsScanQrCode);
    this.app.schemaInitializerManager.addItem('workbench:configureActions', `qrcode`, {
      Component: WorkbenchScanActionSchemaInitializerItem,
    });

    // 打开弹窗
    this.app.schemaSettingsManager.add(workbenchActionSettingsPopup);
    this.app.schemaInitializerManager.addItem('workbench:configureActions', `popup`, {
      Component: WorkbenchPopupActionSchemaInitializerItem,
    });
    // 自定义请求
    this.app.schemaSettingsManager.add(workbenchActionSettingsCustomRequest);
    this.app.schemaInitializerManager.addItem('workbench:configureActions', `customRequest`, {
      Component: WorkbenchCustomRequestActionSchemaInitializerItem,
    });
  }
}

export default PluginBlockWorkbenchClient;
