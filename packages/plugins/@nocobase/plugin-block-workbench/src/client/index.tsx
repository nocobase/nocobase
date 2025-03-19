/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { WorkbenchAction } from './WorkbenchAction';
import { WorkbenchBlock } from './WorkbenchBlock';
import { workbenchBlockInitializerItem } from './workbenchBlockInitializerItem';
import { workbenchBlockSettings } from './workbenchBlockSettings';
import { workbenchConfigureActions } from './workbenchConfigureActions';
import { workbenchActionSettingsLink } from './WorkbenchLinkActionSchemaInitializerItem';
import {
  WorkbenchPopupActionSchemaInitializerItem,
  workbenchActionSettingsPopup,
} from './WorkbenchPopupActionSchemaInitializerItem';
import {
  WorkbenchScanActionSchemaInitializerItem,
  workbenchActionSettingsScanQrCode,
} from './WorkbenchScanActionSchemaInitializerItem';

import {
  WorkbenchCustomRequestActionSchemaInitializerItem,
  workbenchActionSettingsCustomRequest,
} from './WorkbenchCustomRequestActionSchemaInitializerItem';
import { lazy } from '@nocobase/client';
export class PluginBlockWorkbenchClient extends Plugin {
  async load() {
    const { QRCodeScanner } = lazy(() => import('./components/qrcode-scanner'), 'QRCodeScanner');
    this.app.addComponents({ WorkbenchBlock, QRCodeScanner, WorkbenchAction });

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
    // 添加到弹窗的 Add block 里
    this.app.schemaInitializerManager.addItem(
      'popup:common:addBlock',
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
