/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import _ from 'lodash';

export class PluginLocaleTesterServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['localeTester:*'],
    });
  }

  async load() {
    this.app.resourceManager.use(async (ctx, next) => {
      await next();
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'app' && actionName === 'getLang') {
        const repository = this.db.getRepository('localeTester');
        const record = await repository.findOne();
        const locale = record?.locale || {};
        if (locale['cronstrue']) {
          _.set(ctx.body, 'cronstrue', locale['cronstrue']);
        }
        if (locale['react-js-cron']) {
          _.set(ctx.body, 'cron', locale['react-js-cron']);
        }
        Object.keys(locale).forEach((key) => {
          if (key === 'cronstrue' || key === 'react-js-cron') {
            return;
          }
          const value = locale[key];
          _.set(ctx.body, ['resources', key], value);
          const k = key.replace('@nocobase/', '').replace('@nocobase/plugin-', '');
          _.set(ctx.body, ['resources', k], value);
        });
      }
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLocaleTesterServer;
