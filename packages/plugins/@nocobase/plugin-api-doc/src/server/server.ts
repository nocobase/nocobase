/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { SwaggerManager } from './swagger';

export class PluginAPIDocServer extends Plugin {
  swagger: SwaggerManager;
  constructor(app, options) {
    super(app, options);
    this.swagger = new SwaggerManager(this);
  }
  async beforeLoad() {}
  async load() {
    this.app.resourcer.define({
      name: 'swagger',
      type: 'single',
      actions: {
        getUrls: async (ctx: Context, next) => {
          // ctx.withoutDataWrapping = true;
          ctx.body = await this.swagger.getUrls();
          await next();
        },
        get: async (ctx: Context, next) => {
          ctx.withoutDataWrapping = true;
          const { ns } = ctx.action.params;
          if (!ns) {
            ctx.body = await this.swagger.getSwagger();
            return;
          }
          const [type, ...rest] = ns.split('/');
          const index = rest.join('/');
          if (type === 'core') {
            ctx.body = await this.swagger.getCoreSwagger();
          } else if (type === 'plugins') {
            ctx.body = await this.swagger.getPluginsSwagger(index);
          } else if (type === 'collections') {
            ctx.body = await this.swagger.getCollectionsSwagger(index);
          }
          await next();
        },
      },
      only: ['get', 'getUrls'],
    });
    this.app.acl.allow('swagger', ['get', 'getUrls'], 'loggedIn');
    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'documentation'].join('.'),
      actions: ['swagger:*'],
    });
  }
}

export default PluginAPIDocServer;
