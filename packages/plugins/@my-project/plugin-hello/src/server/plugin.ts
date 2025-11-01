/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.dataSourceManager.use(async function dataSourceManagerMiddleware(ctx, next) {
      console.log('DataSource middleware');
      await next();
    });

    // 权限中间件
    this.app.acl.use(async function acl123Middleware(ctx, next) {
      console.log('ACL middleware');
      await next();
    });

    // 资源中间件
    this.app.resourceManager.use(async function resourceManagerMiddleware(ctx, next) {
      console.log('Resource middleware');
      await next();
    });

    this.app.resourceManager.use(async function resourceManager2Middleware(ctx, next) {
      console.log('Resource2 middleware');
      await next();
    });

    console.log('Plugin hello loaded', this.app.resourceManager.getMiddlewares());

    // 应用级中间件
    this.app.use(async function appMiddleware(ctx, next) {
      console.log('App middleware');
      await next();
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginHelloServer;
