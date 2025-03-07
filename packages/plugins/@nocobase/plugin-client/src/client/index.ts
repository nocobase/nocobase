/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { DesktopRoutesManager } from './DesktopRoutesManager';
import { lang as t } from './locale';
import { MobileRoutesManager } from './MobileRoutesManager';
import { ClearCache } from './ClearCache';
import { RestartApplication } from './RestartApplication';

class PluginClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('routes', {
      title: t('Routes'),
      icon: 'ApartmentOutlined',
      aclSnippet: 'pm.routes',
    });
    this.app.pluginSettingsManager.add(`routes.desktop`, {
      title: t('Desktop routes'),
      Component: DesktopRoutesManager,
      aclSnippet: 'pm.routes.desktop',
      sort: 1,
    });

    // 个人中心注册
    this.app.addUserCenterSettingsItem({
      name: 'divider4',
      sort: 499,
      type: 'divider',
      aclSnippet: 'app',
    });
    this.app.addUserCenterSettingsItem({
      name: 'cache',
      sort: 500,
      Component: ClearCache,
      aclSnippet: 'app',
    });
    this.app.addUserCenterSettingsItem({
      name: 'restartApplication',
      Component: RestartApplication,
      sort: 510,
      aclSnippet: 'app',
    });

    const mobilePlugin: any = this.app.pluginManager.get('@nocobase/plugin-mobile');

    if (mobilePlugin?.options?.enabled) {
      this.app.pluginSettingsManager.add(`routes.mobile`, {
        title: t('Mobile routes'),
        Component: MobileRoutesManager,
        aclSnippet: 'pm.routes.mobile',
        sort: 2,
      });
    }
  }
}

export default PluginClient;
