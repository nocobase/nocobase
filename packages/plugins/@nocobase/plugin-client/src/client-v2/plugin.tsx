/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, UserCenterActionItemModel } from '@nocobase/client-v2';

class ClearCacheItemModel extends UserCenterActionItemModel {
  static itemId = 'clear-cache';

  section = 'system' as const;
  sort = 500;
  label = 'Clear cache';
  aclSnippet = 'app';

  async onClick() {
    await this.context.api.resource('app').clearCache();
    window.location.reload();
  }
}

class RestartApplicationItemModel extends UserCenterActionItemModel {
  static itemId = 'restart-application';

  section = 'system' as const;
  sort = 510;
  label = 'Restart application';
  aclSnippet = 'app';

  async onClick() {
    await this.context.api.resource('app').restart();
  }
}

export class PluginClientV2 extends Plugin {
  async load() {
    this.app.flowEngine.registerModels({
      ClearCacheItemModel,
      RestartApplicationItemModel,
    });
  }
}

export default PluginClientV2;
