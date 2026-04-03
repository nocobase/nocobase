/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLRolesCheckProvider, Plugin } from '@nocobase/client-v2';
import { aclLocaleResources } from './locale';

export class PluginAclClientV2 extends Plugin {
  async load() {
    Object.entries(aclLocaleResources).forEach(([lang, resource]) => {
      this.app.i18n.addResources(lang, this.options?.['packageName'] || '@nocobase/plugin-acl', resource);
    });

    this.app.use(ACLRolesCheckProvider);

    this.app.headerActionsManager.register({
      name: 'ui',
      order: 100,
      pin: true,
      snippet: 'ui.*',
      componentLoader: () => import('./components/DesignableSwitch'),
    });
  }
}

export default PluginAclClientV2;
