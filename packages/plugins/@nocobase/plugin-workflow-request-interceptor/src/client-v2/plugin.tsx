/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Application, Plugin } from '@nocobase/client-v2';
import WorkflowPlugin from '@nocobase/plugin-workflow/client-v2';

import RequestInterceptionTrigger from './RequestInterceptionTrigger';

export class PluginWorkflowRequestInterceptorClientV2 extends Plugin<unknown, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger('request-interception', RequestInterceptionTrigger);
  }
}

export default PluginWorkflowRequestInterceptorClientV2;
