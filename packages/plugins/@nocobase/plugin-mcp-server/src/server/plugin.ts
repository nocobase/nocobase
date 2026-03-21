/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type PluginIdpOauthServer from '@nocobase/plugin-idp-oauth';
import { collectMcpToolsFromSwagger } from './mcp-tools';
import { McpServer } from './mcp-server';
import { createCrudTool } from './crud-tool';

function normalizeBasePath(path = '') {
  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

export class PluginMcpServerServer extends Plugin {
  private mcpServer: McpServer;
  private readonly mcpScopes = ['mcp', 'offline_access'] as const;

  private getApiBasePath() {
    return normalizeBasePath(process.env.API_BASE_PATH || '/api');
  }

  private getMcpPath() {
    return `${this.getApiBasePath()}/mcp`;
  }

  private getIdpOauthPlugin() {
    return this.app.pm.get('idp-oauth') as PluginIdpOauthServer | undefined;
  }

  private getOauthMetadata(ctx: any) {
    const issuer = this.getIdpOauthPlugin()?.service?.getProviderContext(ctx).issuer;
    if (!issuer) {
      return undefined;
    }

    return {
      issuer,
      resource: `${issuer}/mcp`,
      resourceMetadataUrl: `${issuer}/.well-known/oauth-protected-resource`,
    };
  }

  private rewriteUnauthorizedResponse(ctx: any) {
    const metadata = this.getOauthMetadata(ctx);
    if (metadata) {
      ctx.set(
        'WWW-Authenticate',
        `Bearer resource_metadata="${metadata.resourceMetadataUrl}", scope="${this.mcpScopes.join(' ')}"`,
      );
    }
    ctx.withoutDataWrapping = true;
    ctx.type = 'application/json';
    ctx.status = 401;
    ctx.body = {
      errors: [{ message: 'Authentication required' }],
    };
  }

  private registerProtectedResourceMetadataRoute() {
    const metadataPath = `${this.getApiBasePath()}/.well-known/oauth-protected-resource`;

    this.app.use(
      async (ctx, next) => {
        if (ctx.path !== metadataPath || ctx.method !== 'GET') {
          await next();
          return;
        }

        const metadata = this.getOauthMetadata(ctx);
        if (!metadata) {
          await next();
          return;
        }

        ctx.withoutDataWrapping = true;
        ctx.type = 'application/json';
        ctx.body = {
          resource: metadata.resource,
          authorization_servers: [metadata.issuer],
          scopes_supported: [...this.mcpScopes],
        };
      },
      {
        tag: 'mcp-oauth-protected-resource',
        before: 'dataWrapping',
      },
    );
  }

  private registerIdpResource() {
    this.getIdpOauthPlugin()?.service?.registerResourceServer('mcp', {
      path: '/mcp',
      scope: this.mcpScopes.join(' '),
      accessTokenFormat: 'jwt',
      jwt: {
        sign: { alg: 'RS256' },
      },
    });
  }

  private unregisterIdpResource() {
    this.getIdpOauthPlugin()?.service?.unregisterResourceServer?.('mcp');
  }

  private async registerMcpTools() {
    const apiTools = await collectMcpToolsFromSwagger({
      app: this.app,
    });
    this.ai.mcpToolsManager.registerTools([...apiTools, createCrudTool({ app: this.app })]);
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.registerMcpTools();
    if (this.getIdpOauthPlugin()?.service) {
      this.registerIdpResource();
      this.registerProtectedResourceMetadataRoute();
    }

    this.mcpServer = new McpServer({
      name: 'nocobase-mcp-server',
      version: this.options.version || '0.0.0',
      toolsManager: this.ai.mcpToolsManager,
      logger: this.log,
    });

    this.app.use(
      async (ctx, next) => {
        if (ctx.path !== this.getMcpPath()) {
          return next();
        }

        try {
          await next();
        } catch (error) {
          if (ctx.status === 401 || error?.status === 401 || error?.statusCode === 401) {
            this.rewriteUnauthorizedResponse(ctx);
            return;
          }
          throw error;
        }

        if (ctx.status === 401) {
          this.rewriteUnauthorizedResponse(ctx);
        }
      },
      {
        tag: 'mcp-unauthorized-response',
        before: 'dataSource',
      },
    );

    const mcpHandler = async (ctx) => {
      await this.mcpServer.handlePost(ctx);
    };
    this.app.resourceManager.define({
      name: 'mcp',
      actions: {
        // list and create are default methods for 'GET' and 'POST' requests
        // so that the mcp server can be called via '/mcp' endpoint directly
        list: mcpHandler,
        create: mcpHandler,
      },
      only: ['list', 'create'],
    });
    this.app.acl.allow('mcp', '*', 'loggedIn');
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.unregisterIdpResource();
  }

  async remove() {
    this.unregisterIdpResource();
  }
}

export default PluginMcpServerServer;
