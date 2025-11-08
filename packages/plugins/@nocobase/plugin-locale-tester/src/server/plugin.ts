/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import deepmerge from 'deepmerge';
import _ from 'lodash';

async function getLang(ctx) {
  const SystemSetting = ctx.db.getRepository('systemSettings');
  const systemSetting = await SystemSetting.findOne();
  const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
  const currentUser = ctx.state.currentUser;
  let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
  if (enabledLanguages.includes(currentUser?.appLang)) {
    lang = currentUser?.appLang;
  }
  if (ctx.request.query.locale && enabledLanguages.includes(ctx.request.query.locale)) {
    lang = ctx.request.query.locale;
  }
  return lang;
}

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
      if (resourceName === 'localeTester' && actionName === 'get') {
        const lang = await getLang(ctx);
        const data = await ctx.app.localeManager.get(lang);
        const locale = {};
        Object.keys(data.resources).forEach((key) => {
          if (key.startsWith('@')) {
            locale[key] = data.resources[key];
          }
        });
        const merged = deepmerge(locale, ctx.body.locale || {});
        if (!merged['cronstrue']) {
          merged['cronstrue'] = data.cronstrue;
        }
        if (!merged['react-js-cron']) {
          merged['react-js-cron'] = data['cron'];
        }
        ctx.body = {
          ...ctx.body.toJSON(),
          locale: merged,
        };
      } else if (resourceName === 'app' && actionName === 'getLang') {
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
          const k = key.replace('@nocobase/plugin-', '').replace('@nocobase/', '');
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
