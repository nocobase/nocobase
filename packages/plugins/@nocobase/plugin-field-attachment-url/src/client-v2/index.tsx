/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { AttachmentURLFieldInterface } from './interfaces/attachment-url';

export class PluginFieldAttachmentUrlClient extends Plugin<any, Application> {
  async load() {
    this.app.addFieldInterfaces([AttachmentURLFieldInterface]);
    this.flowEngine.registerModelLoaders({
      AttachmentURLFieldModel: {
        loader: () => import('./AttachmentURLFieldModel'),
      },
    });
  }
}

export { AttachmentURLFieldInterface } from './interfaces/attachment-url';
export { AttachmentURLFieldModel } from './AttachmentURLFieldModel';
export default PluginFieldAttachmentUrlClient;
