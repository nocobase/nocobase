/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class AppInfoDemoPlugin extends Plugin {
  async load() {
    try {
      const response = await this.app.apiClient.request({
        url: 'app:getInfo',
      });
      console.log('[client-v2 demo plugin] /api/app:getInfo', response?.data);
    } catch (error) {
      console.error('[client-v2 demo plugin] failed to request /api/app:getInfo', error);
    }
  }
}
