/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { McpTool } from '@nocobase/ai';
import type { McpToolCallContext } from '@nocobase/ai';
import type { OpenAPIV3 } from 'openapi-types';
import { requireModule } from '@nocobase/utils';
import { merge as deepmerge } from '@nocobase/utils';
import inject from 'light-my-request';

type OpenAPIDocument = OpenAPIV3.Document;
type McpToolDefinitionWithBaseUrl = import('openapi-mcp-generator').McpToolDefinition & { baseUrl?: string };

const SWAGGER_TARGETS = ['swagger.json', 'swagger/index.json', 'swagger'];

function getSwaggerPrefixes() {
  if (process.env.NODE_ENV === 'production') {
    return ['lib', 'dist', 'src'];
  }
  return ['src', 'lib', 'dist'];
}

function loadSwagger(packageName: string): Partial<OpenAPIDocument> {
  const prefixes = getSwaggerPrefixes();
  for (const prefix of prefixes) {
    for (const target of SWAGGER_TARGETS) {
      try {
        const file = `${packageName}/${prefix}/${target}`;
        const filePath = require.resolve(file);
        delete require.cache[filePath];
        return requireModule(file);
      } catch (error) {
        // ignore and keep trying other targets
      }
    }
  }
  return {};
}

function mergeSwagger(target: OpenAPIDocument, source: Partial<OpenAPIDocument>): OpenAPIDocument {
  return deepmerge(target, source, {
    arrayMerge: (destinationArray, sourceArray) => sourceArray.concat(destinationArray),
  }) as OpenAPIDocument;
}

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    return path;
  }
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function buildRequest(
  tool: McpToolDefinitionWithBaseUrl,
  args: Record<string, any> = {},
  context?: McpToolCallContext,
) {
  const missingPathParams: string[] = [];
  const path = tool.pathTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = args[key];
    if (value === undefined || value === null) {
      missingPathParams.push(key);
      return `{${key}}`;
    }
    return encodeURIComponent(String(value));
  });

  const query: Record<string, any> = {};
  const headers: Record<string, any> = {};
  const cookies: Record<string, string> = {};

  for (const parameter of tool.executionParameters ?? []) {
    const value = args[parameter.name];
    if (value === undefined) {
      continue;
    }
    if (parameter.in === 'query') {
      query[parameter.name] = value;
      continue;
    }
    if (parameter.in === 'header') {
      headers[parameter.name] = String(value);
      continue;
    }
    if (parameter.in === 'cookie') {
      cookies[parameter.name] = String(value);
    }
  }

  if (context?.token && !headers.authorization && !headers.Authorization) {
    headers.authorization = `Bearer ${context.token}`;
  }

  let payload = args.requestBody;
  if (payload !== undefined && tool.requestBodyContentType && !headers['content-type']) {
    headers['content-type'] = tool.requestBodyContentType;
  }

  if (
    payload !== undefined &&
    tool.requestBodyContentType?.includes('application/json') &&
    typeof payload === 'string'
  ) {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      // keep original payload string
    }
  }

  return {
    missingPathParams,
    method: tool.method.toUpperCase(),
    url: joinUrl(tool.baseUrl || '', path),
    query,
    headers,
    cookies,
    payload,
  };
}

export async function collectMcpToolsFromSwagger(options: {
  app: {
    db: any;
    version: { get: () => Promise<string> };
    resourcer: { options?: { prefix?: string } };
    callback: () => any;
  };
}): Promise<McpTool[]> {
  const { app } = options;
  const plugins = await app.db.getRepository('applicationPlugins').find({
    filter: {
      enabled: true,
    },
  });

  let swagger = {
    openapi: '3.0.3',
    info: {
      title: 'NocoBase API - MCP',
      version: await app.version.get(),
    },
    paths: {},
    servers: [
      {
        url: (app.resourcer.options?.prefix || '/').replace(/^[^/]/, '/$1'),
      },
    ],
  } as OpenAPIDocument;

  swagger = mergeSwagger(swagger, loadSwagger('@nocobase/server'));

  for (const plugin of plugins) {
    const packageName = plugin.get('packageName');
    if (!packageName) {
      continue;
    }
    const pluginSwagger = loadSwagger(packageName);
    if (Object.keys(pluginSwagger).length === 0) {
      continue;
    }
    swagger = mergeSwagger(swagger, pluginSwagger);
  }

  const { getToolsFromOpenApi } = await import('openapi-mcp-generator');
  const mcpTools = (await getToolsFromOpenApi(swagger)) as McpToolDefinitionWithBaseUrl[];

  return mcpTools.map((tool) => {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      call: async (args: Record<string, any>, context?: McpToolCallContext) => {
        const request = buildRequest(tool, args, context);
        if (request.missingPathParams.length > 0) {
          throw new Error(`Missing required path params: ${request.missingPathParams.join(', ')}`);
        }

        const response = await inject(app.callback(), {
          method: request.method as any,
          url: request.url,
          query: request.query,
          headers: request.headers,
          cookies: request.cookies,
          payload: request.payload,
        });

        const contentType = String(response.headers['content-type'] || '').toLowerCase();
        const body =
          contentType.includes('application/json') || contentType.includes('+json')
            ? (() => {
                try {
                  return response.json();
                } catch (error) {
                  return response.payload;
                }
              })()
            : response.payload;

        if (response.statusCode >= 400) {
          throw new Error(
            JSON.stringify({
              statusCode: response.statusCode,
              body,
            }),
          );
        }

        return body;
      },
    };
  });
}
