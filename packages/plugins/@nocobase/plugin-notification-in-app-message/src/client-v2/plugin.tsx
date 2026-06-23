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
 *   - Mobile shell: MobileChannelPage / MobileMessagePage / MobileTabBarMessageItem /
 *     messageSchemaInitializerItem depend on `@nocobase/plugin-mobile` v2.
 */

import { Plugin } from '@nocobase/client-v2';
import type { Application } from '@nocobase/client-v2';
import PluginNotificationManagerClientV2 from '@nocobase/plugin-notification-manager/client-v2';
import { setApiClient } from './apiClient';
import { tExpr } from './locale';

const NAMESPACE = 'notification-in-app-message';
const IN_APP_TYPE = 'in-app-message';

export class PluginNotificationInAppMessageClientV2 extends Plugin<Record<string, never>, Application> {
  async beforeLoad() {
    const manager = this.pm.get(PluginNotificationManagerClientV2);
    if (manager) {
      manager.registerChannelType({
        type: IN_APP_TYPE,
        title: tExpr('In-app message'),
        components: {
          MessageConfigFormLoader: () => import('./components/MessageConfigForm'),
        },
        meta: {
          creatable: true,
          editable: true,
          deletable: true,
        },
      });
    }
  }

  async load() {
    // Capture the app's api client into the module-level singleton so the
    // observable side effects in state.ts can call resource endpoints
    // without each component plumbing `ctx.api` through. Mirrors v1's
    // `setAPIClient(this.app.apiClient)` from `src/client/utils.ts`.
    setApiClient(this.app.apiClient);

    this.flowEngine.registerModelLoaders({
      InboxTopbarActionModel: {
        extends: 'TopbarActionModel',
        loader: () => import('./models/InboxTopbarActionModel'),
      },
    });
  }
}

// Re-export NAMESPACE so it stays a hard-coded constant on the plugin side.
export { NAMESPACE };

export default PluginNotificationInAppMessageClientV2;
