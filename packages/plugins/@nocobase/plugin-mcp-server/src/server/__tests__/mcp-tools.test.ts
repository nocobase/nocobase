/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { describe, expect, it } from 'vitest';
import { McpToolsManager } from '@nocobase/ai';
import type { Application } from '@nocobase/server';
import { sanitizeJsonSchemaForOpenAITools } from '../schema-utils';
import {
  collectMcpToolsFromSwagger,
  filterSwaggerOperationsForMcp,
  normalizeMcpToolName,
  parseResourceActionFromPath,
} from '../mcp-tools';

function createSwaggerTestApp(
  handler: (ctx: Koa.Context) => void = (ctx) => {
    ctx.body = { data: { ok: true } };
  },
) {
  const server = new Koa();
  server.use(bodyParser());
  server.use(async (ctx) => handler(ctx));

  return {
    callback: () => server.callback(),
    db: {
      getRepository: () => ({
        find: async () => [
          {
            get: (key: string) => (key === 'packageName' ? '@nocobase/plugin-light-extension' : true),
          },
        ],
      }),
    },
    version: {
      get: async () => 'test',
    },
    resourcer: {
      options: {
        prefix: '/api',
      },
    },
    aiManager: {
      mcpToolsManager: new McpToolsManager(),
    },
  } as unknown as Application;
}

async function collectLightExtensionTools(app = createSwaggerTestApp()) {
  return collectMcpToolsFromSwagger({
    app,
    packagePatterns: ['@nocobase/plugin-light-extension'],
  });
}

describe('sanitizeJsonSchemaForOpenAITools', () => {
  it('should remove null type and nullable markers recursively', () => {
    const schema = sanitizeJsonSchemaForOpenAITools({
      type: 'object',
      properties: {
        requestBody: {
          type: null,
          nullable: true,
          properties: {
            actions: {
              type: 'array',
              items: {
                type: null,
                nullable: true,
                properties: {
                  scope: {
                    type: 'null',
                    nullable: true,
                    properties: {
                      id: {
                        type: ['integer', 'null'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(schema).toEqual({
      type: 'object',
      properties: {
        requestBody: {
          type: 'object',
          properties: {
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scope: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('should parse resource and action names from action paths', () => {
    expect(parseResourceActionFromPath('/collections:list')).toEqual({
      resourceName: 'collections',
      actionName: 'list',
    });

    expect(parseResourceActionFromPath('/collections/{filterByTk}/fields:list')).toEqual({
      resourceName: 'collections.fields',
      actionName: 'list',
    });
  });

  it('should apply registered post processors by resource and action', async () => {
    const manager = new McpToolsManager();

    manager.registerToolResultPostProcessor('collections', 'list', (result) => {
      return {
        ...result,
        compressed: true,
      };
    });

    const output = await manager.postProcessToolResult(
      {
        name: 'collections_list',
        description: 'list collections',
        resourceName: 'collections',
        actionName: 'list',
        call: async () => null,
      },
      {
        data: [],
      },
      {
        args: {},
      },
    );

    expect(output).toEqual({
      data: [],
      compressed: true,
    });
  });

  it('should normalize generated tool names without method prefixes', () => {
    expect(
      normalizeMcpToolName({
        name: 'PostCollectionsFields_destroy',
        pathTemplate: '/collections/{filterByTk}/fields:destroy',
      }),
    ).toBe('collections_fields_destroy');

    expect(
      normalizeMcpToolName({
        name: 'GetCollections_listMeta',
        pathTemplate: '/collections:listMeta',
      }),
    ).toBe('collections_list_meta');
  });

  it('should honor document, path, and operation MCP exposure markers', () => {
    const swagger = filterSwaggerOperationsForMcp({
      openapi: '3.0.3',
      info: { title: 'test', version: '1' },
      'x-mcp': false,
      paths: {
        '/allowed': {
          post: {
            'x-mcp': true,
            responses: { 200: { description: 'ok' } },
          },
        },
        '/hidden-by-default': {
          post: {
            responses: { 200: { description: 'ok' } },
          },
        },
        '/allowed-by-path': {
          'x-mcp': true,
          post: {
            responses: { 200: { description: 'ok' } },
          },
        },
        '/excluded-by-operation': {
          'x-mcp': true,
          post: {
            'x-mcp': false,
            responses: { 200: { description: 'ok' } },
          },
        },
      },
    });

    expect(Object.keys(swagger.paths)).toEqual(['/allowed', '/allowed-by-path']);
    expect(swagger['x-mcp']).toBeUndefined();
  });

  it('should require package opt-in and expose only approved light-extension authoring operations', async () => {
    const app = createSwaggerTestApp();
    const defaultTools = await collectMcpToolsFromSwagger({ app });
    const optedInTools = await collectLightExtensionTools(app);

    expect(defaultTools).toEqual([]);
    expect(optedInTools.map((tool) => `${tool.resourceName}:${tool.actionName}`).sort()).toEqual(
      [
        'lightExtensionContexts:get',
        'lightExtensionEntries:get',
        'lightExtensionFiles:getFile',
        'lightExtensionFiles:pull',
        'lightExtensionFiles:saveSource',
        'lightExtensionReferences:readReferences',
        'lightExtensionRepos:get',
        'lightExtensionRepos:list',
        'lightExtensions:compileWorkspacePreview',
      ].sort(),
    );
    expect(optedInTools.map((tool) => tool.resourceName)).not.toEqual(
      expect.arrayContaining(['runJSSources', 'vscFile', 'vscFileArtifacts', 'lightExtensionSync']),
    );
    expect(optedInTools.map((tool) => tool.path).join('\n')).not.toMatch(
      /runJSSources|vscFile|artifact|credential|restore|recovery|lightExtensionSync/iu,
    );
  });

  it('should forward only the current MCP identity headers to Swagger resource actions', async () => {
    let requestHeaders: Koa.Request['headers'] | undefined;
    const tools = await collectLightExtensionTools(
      createSwaggerTestApp((ctx) => {
        requestHeaders = ctx.request.headers;
        ctx.body = { data: { ok: true } };
      }),
    );
    const pull = tools.find((tool) => tool.resourceName === 'lightExtensionFiles' && tool.actionName === 'pull');

    await pull?.call(
      { requestBody: { repoId: 'repo-1' } },
      {
        token: 'current-token',
        headers: {
          Authorization: 'Bearer ignored-token',
          'X-Role': 'author-role',
          'x-authenticator': ['password', 'ignored'],
          'x-untrusted-admin': 'true',
        },
      },
    );

    expect(requestHeaders).toMatchObject({
      authorization: 'Bearer current-token',
      'x-role': 'author-role',
      'x-authenticator': 'password',
    });
    expect(requestHeaders).not.toHaveProperty('x-untrusted-admin');
  });

  it('should return structured 422 CheckResult details without guessing from legacy fields', async () => {
    const checkResult = {
      accepted: false,
      baseHeadCommitId: 'commit-1',
      snapshotId: 'snapshot-1',
      requestId: 'request-1',
      problems: [{ code: 'RUNJS_COMPILE_FAILED' }],
      entries: [{ entryId: 'accepted-entry', accepted: true }],
    };
    const tools = await collectLightExtensionTools(
      createSwaggerTestApp((ctx) => {
        ctx.status = 422;
        ctx.body = {
          errors: [
            {
              status: 422,
              code: 'LIGHT_EXTENSION_WORKSPACE_REJECTED',
              message: 'Workspace rejected',
              details: checkResult,
            },
          ],
          problems: [{ code: 'LEGACY_TOP_LEVEL_PROBLEM' }],
        };
      }),
    );
    const preview = tools.find(
      (tool) => tool.resourceName === 'lightExtensions' && tool.actionName === 'compileWorkspacePreview',
    );

    const error = await preview
      ?.call({ requestBody: { repoId: 'repo-1', expectedHeadCommitId: 'commit-1', files: [] } })
      .catch((reason: unknown) => reason);
    const content = JSON.parse((error as Error).message);

    expect(content).toEqual({
      status: 422,
      code: 'LIGHT_EXTENSION_WORKSPACE_REJECTED',
      message: 'Workspace rejected',
      details: checkResult,
    });
    expect(content.details.problems).not.toContainEqual({ code: 'LEGACY_TOP_LEVEL_PROBLEM' });
  });

  it.each([
    [403, 'LIGHT_EXTENSION_PERMISSION_DENIED'],
    [409, 'LIGHT_EXTENSION_SOURCE_OUTDATED'],
  ])('should keep structured status and code for HTTP %s', async (status, code) => {
    const tools = await collectLightExtensionTools(
      createSwaggerTestApp((ctx) => {
        ctx.status = status;
        ctx.body = {
          errors: [{ status, code, message: `Failure ${status}`, details: { currentHeadCommitId: 'commit-2' } }],
        };
      }),
    );
    const pull = tools.find((tool) => tool.resourceName === 'lightExtensionFiles' && tool.actionName === 'pull');

    const error = await pull?.call({ requestBody: { repoId: 'repo-1' } }).catch((reason: unknown) => reason);

    expect(JSON.parse((error as Error).message)).toEqual({
      status,
      code,
      message: `Failure ${status}`,
      details: { currentHeadCommitId: 'commit-2' },
    });
  });
});
