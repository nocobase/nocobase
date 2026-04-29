/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // 注册资源和接口
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — 读取配置
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — 保存配置
        async set(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const values = ctx.action?.params?.values;
          const existing = await repo.findOne();
          if (existing) {
            await repo.update({ values, filter: { id: existing.id } });
          } else {
            await repo.create({ values });
          }
          ctx.body = { ok: true };
          await next();
        },
      },
    });

    // 登录用户可以读取配置
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
