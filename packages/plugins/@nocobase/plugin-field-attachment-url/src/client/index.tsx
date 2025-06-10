/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, lazy } from '@nocobase/client';
import { AttachmentURLFieldInterface } from './interfaces/attachment-url';
import { useAttachmentUrlFieldProps } from './hook';
// import { AttachmentUrl } from './component/AttachmentUrl';
const { AttachmentUrl } = lazy(() => import('./component/AttachmentUrl'), 'AttachmentUrl');

import { attachmentUrlComponentFieldSettings } from './settings';
export class PluginFieldAttachmentUrlClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.dataSourceManager.addFieldInterfaces([AttachmentURLFieldInterface]);
    this.app.addScopes({ useAttachmentUrlFieldProps });

    this.app.addComponents({ AttachmentUrl });
    this.app.schemaSettingsManager.add(attachmentUrlComponentFieldSettings);

    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginFieldAttachmentUrlClient;
