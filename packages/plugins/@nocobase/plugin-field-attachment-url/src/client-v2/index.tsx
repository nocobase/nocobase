/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { AttachmentURLFieldModel } from './AttachmentURLFieldModel';

export class PluginFieldAttachmentUrlClient extends Plugin {
  async load() {
    this.app.flowEngine.registerModels({ AttachmentURLFieldModel });
  }
}

export { AttachmentURLFieldModel } from './AttachmentURLFieldModel';
export default PluginFieldAttachmentUrlClient;
