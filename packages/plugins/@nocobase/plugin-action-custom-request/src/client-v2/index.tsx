/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { CustomRequestActionModel, registerCustomRequestActionGroups } from './CustomRequestActionModel';
import { customRequestFlowAction } from './customRequestFlowAction';

export class PluginActionCustomRequestClient extends Plugin {
  async load() {
    this.app.flowEngine.registerActions({ customRequestFlowAction });
    this.app.flowEngine.registerModels({
      CustomRequestActionModel,
    });
    registerCustomRequestActionGroups(this.app.flowEngine);
  }
}

export { CustomRequestActionModel } from './CustomRequestActionModel';
export { customRequestFlowAction } from './customRequestFlowAction';
export default PluginActionCustomRequestClient;
