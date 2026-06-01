/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * TODO (deferred to follow-up v2 migrations):
 *   - MessageConfigForm / ContentConfigForm: depend on `@nocobase/plugin-workflow`
 *     v2 (workflow injects `variableOptions` into both forms). Will be added when
 *     workflow's client-v2 lands.
 */

import { Plugin } from '@nocobase/client-v2';
import type { Application } from '@nocobase/client-v2';
import PluginNotificationManagerClientV2 from '@nocobase/plugin-notification-manager/client-v2';
import { NAMESPACE, tExpr } from './locale';

const EMAIL_TYPE = 'email';

export class PluginNotificationEmailClientV2 extends Plugin<Record<string, never>, Application> {
  async beforeLoad() {
    const manager = this.pm.get(PluginNotificationManagerClientV2);
    if (manager) {
      manager.registerChannelType({
        type: EMAIL_TYPE,
        title: tExpr('Email'),
        components: {
          ChannelConfigFormLoader: () => import('./forms/ChannelConfigForm'),
        },
        meta: {
          creatable: true,
          editable: true,
          deletable: true,
        },
      });
    }
  }
}

export { NAMESPACE };

export default PluginNotificationEmailClientV2;
