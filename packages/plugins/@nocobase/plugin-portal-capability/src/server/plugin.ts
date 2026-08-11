/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { PortalDataCapabilityService } from './portal-data-capability-service';

type ActionInput = Record<string, unknown>;
type PortalCapabilityApp = ConstructorParameters<typeof Plugin>[0] & {
  resourcer: {
    define(options: Record<string, unknown>): void;
  };
  acl: {
    allow(resource: string, actions: string[], condition: string): void;
    registerSnippet(snippet: { name: string; actions: string[] }): void;
  };
};

export class PluginPortalCapabilityServer extends Plugin {
  declare app: PortalCapabilityApp;

  dataCapability: PortalDataCapabilityService;

  constructor(app, options) {
    super(app, options);
    this.dataCapability = new PortalDataCapabilityService(app);
  }

  async load() {
    this.app.resourcer.define({
      name: 'portalDataCapability',
      type: 'single',
      actions: {
        capabilities: async (ctx: Context, next) => {
          ctx.body = this.dataCapability.capabilities();
          await next();
        },
        metadata: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.metadata(this.getActionInput(ctx), { ctx });
          await next();
        },
        query: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.query(this.getActionInput(ctx), { ctx });
          await next();
        },
        get: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.get(this.getActionInput(ctx), { ctx });
          await next();
        },
        create: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.create(this.getActionInput(ctx), { ctx });
          await next();
        },
        update: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.update(this.getActionInput(ctx), { ctx });
          await next();
        },
        destroy: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.destroy(this.getActionInput(ctx), { ctx });
          await next();
        },
        aggregate: async (ctx: Context, next) => {
          ctx.body = await this.dataCapability.aggregate(this.getActionInput(ctx), { ctx });
          await next();
        },
      },
      only: ['capabilities', 'metadata', 'query', 'get', 'create', 'update', 'destroy', 'aggregate'],
    });

    this.app.acl.allow('portalDataCapability', ['capabilities'], 'public');
    this.app.acl.allow(
      'portalDataCapability',
      ['metadata', 'query', 'get', 'create', 'update', 'destroy', 'aggregate'],
      'loggedIn',
    );
    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'data-capability'].join('.'),
      actions: ['portalDataCapability:*'],
    });
  }

  private getActionInput(ctx: Context): ActionInput {
    const values = ctx.action.params.values;

    if (values && typeof values === 'object' && !Array.isArray(values)) {
      return values as ActionInput;
    }

    return ctx.action.params as ActionInput;
  }
}

export default PluginPortalCapabilityServer;
