/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';

type AIPageHttpRoute = {
  method: string;
  pattern: RegExp;
  params: string[];
  browserAction: string;
  agentAction?: string;
};

const routes: AIPageHttpRoute[] = [
  { method: 'GET', pattern: /^\/openapi\.json$/, params: [], browserAction: 'openapi' },
  { method: 'POST', pattern: /^\/pages$/, params: [], browserAction: 'createPage' },
  {
    method: 'GET',
    pattern: /^\/pages\/([^/]+)$/,
    params: ['pageSchemaUid'],
    browserAction: 'getPage',
    agentAction: 'agentGetPage',
  },
  { method: 'DELETE', pattern: /^\/pages\/([^/]+)$/, params: ['pageSchemaUid'], browserAction: 'deletePage' },
  {
    method: 'GET',
    pattern: /^\/pages\/([^/]+)\/source$/,
    params: ['pageSchemaUid'],
    browserAction: 'getSource',
    agentAction: 'agentGetSource',
  },
  {
    method: 'PUT',
    pattern: /^\/pages\/([^/]+)\/source$/,
    params: ['pageSchemaUid'],
    browserAction: 'putSource',
    agentAction: 'agentPutSource',
  },
  {
    method: 'PATCH',
    pattern: /^\/pages\/([^/]+)\/source$/,
    params: ['pageSchemaUid'],
    browserAction: 'patchSource',
    agentAction: 'agentPatchSource',
  },
  {
    method: 'POST',
    pattern: /^\/pages\/([^/]+)\/validate$/,
    params: ['pageSchemaUid'],
    browserAction: 'validateSource',
    agentAction: 'agentValidateSource',
  },
  {
    method: 'POST',
    pattern: /^\/pages\/([^/]+)\/preview$/,
    params: ['pageSchemaUid'],
    browserAction: 'preview',
    agentAction: 'agentPreview',
  },
  { method: 'POST', pattern: /^\/pages\/([^/]+)\/publish$/, params: ['pageSchemaUid'], browserAction: 'publish' },
  {
    method: 'GET',
    pattern: /^\/pages\/([^/]+)\/revisions$/,
    params: ['pageSchemaUid'],
    browserAction: 'revisions',
    agentAction: 'agentRevisions',
  },
  { method: 'POST', pattern: /^\/pages\/([^/]+)\/rollback$/, params: ['pageSchemaUid'], browserAction: 'rollback' },
  {
    method: 'POST',
    pattern: /^\/pages\/([^/]+)\/sessions$/,
    params: ['pageSchemaUid'],
    browserAction: 'createSession',
  },
  { method: 'POST', pattern: /^\/sessions\/([^/]+)\/pair$/, params: ['sessionId'], browserAction: 'pair' },
  {
    method: 'GET',
    pattern: /^\/sessions\/([^/]+)\/events$/,
    params: ['sessionId'],
    browserAction: 'events',
    agentAction: 'agentEvents',
  },
  {
    method: 'DELETE',
    pattern: /^\/sessions\/([^/]+)$/,
    params: ['sessionId'],
    browserAction: 'closeSession',
    agentAction: 'agentCloseSession',
  },
  {
    method: 'POST',
    pattern: /^\/sessions\/([^/]+)\/runtime-results$/,
    params: ['sessionId'],
    browserAction: 'runtimeResult',
  },
];

function normalizeBasePath(path = '') {
  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

export function createAIPageHttpRouter() {
  const apiBasePath = normalizeBasePath(process.env.API_BASE_PATH || '/api');
  const publicBasePath = `${apiBasePath}/ai-page/v1`;

  return async (ctx: Context, next: Next) => {
    if (!ctx.path.startsWith(publicBasePath)) {
      await next();
      return;
    }

    const relativePath = ctx.path.slice(publicBasePath.length) || '/';
    const route = routes.find((candidate) => candidate.method === ctx.method && candidate.pattern.test(relativePath));
    if (!route) {
      ctx.withoutDataWrapping = true;
      ctx.status = 404;
      ctx.body = {
        error: {
          code: 'route_not_found',
          message: ctx.t('AI Page API route not found', { ns: '@nocobase/plugin-ai-page' }),
        },
      };
      return;
    }

    const match = relativePath.match(route.pattern);
    const params = Object.fromEntries(
      route.params.map((name, index) => [name, decodeURIComponent(match?.[index + 1] || '')]),
    );
    const bearerToken = ctx.get('Authorization').replace(/^Bearer\s+/i, '');
    const action = bearerToken.startsWith('aip_') && route.agentAction ? route.agentAction : route.browserAction;
    ctx.state.aiPageHttp = { params, publicBasePath };
    ctx.path = `${apiBasePath}/aiPageApi:${action}`;
    await next();
  };
}
