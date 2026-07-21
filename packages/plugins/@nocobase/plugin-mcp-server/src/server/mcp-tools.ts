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
import { Application } from '@nocobase/server';
import { requireModule } from '@nocobase/utils';
import { merge as deepmerge } from '@nocobase/utils';
import inject from 'light-my-request';
import { buildMcpIdentityHeaders, isMcpIdentityHeader } from './request-headers';
import { sanitizeJsonSchemaForOpenAITools } from './schema-utils';

type OpenAPIDocument = OpenAPIV3.Document;
type McpToolDefinitionWithBaseUrl = import('openapi-mcp-generator').McpToolDefinition & { baseUrl?: string };
type McpExposure = boolean | { enabled?: boolean };
type ApiErrorItem = {
  code?: unknown;
  details?: unknown;
  message?: unknown;
  status?: unknown;
};

export const DEFAULT_MCP_PACKAGE_PATTERNS = [];

function getSwaggerTargets() {
  return ['swagger.json', 'swagger/index.json', 'swagger/index.ts', 'swagger/index.js', 'swagger'];
}

function getSwaggerPrefixes() {
  if (process.env.NODE_ENV === 'production') {
    return ['lib', 'dist', 'src'];
  }
  return ['src', 'lib', 'dist'];
}

function loadSwagger(packageName: string): Partial<OpenAPIDocument> {
  const prefixes = getSwaggerPrefixes();
  for (const prefix of prefixes) {
    for (const target of getSwaggerTargets()) {
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

export function normalizePackageName(packageName: string) {
  const normalized = packageName.trim();
  if (!normalized) {
    return '';
  }
  if (normalized.startsWith('@')) {
    return normalized;
  }
  return `@nocobase/${normalized}`;
}

export function normalizePackagePatterns(packageNames: string[] = []) {
  return [...new Set(packageNames.map(normalizePackageName).filter(Boolean))];
}

function matchesPackagePattern(packageName: string, pattern: string) {
  if (pattern.endsWith('*')) {
    return packageName.startsWith(pattern.slice(0, -1));
  }
  return packageName === pattern;
}

function shouldIncludePackage(packageName: string, patterns?: string[]) {
  const normalizedPatterns = patterns?.length ? normalizePackagePatterns(patterns) : DEFAULT_MCP_PACKAGE_PATTERNS;
  return normalizedPatterns.some((pattern) => matchesPackagePattern(packageName, pattern));
}

function mergeSwagger(target: OpenAPIDocument, source: Partial<OpenAPIDocument>): OpenAPIDocument {
  return deepmerge(target, source, {
    arrayMerge: (destinationArray, sourceArray) => sourceArray.concat(destinationArray),
  }) as OpenAPIDocument;
}

function resolveLocalRef(document: OpenAPIDocument, ref: string) {
  if (!ref.startsWith('#/')) {
    return undefined;
  }

  return ref
    .slice(2)
    .split('/')
    .reduce<any>((current, segment) => current?.[segment], document);
}

function dereferenceNode(node: any, document: OpenAPIDocument, seen = new Set<string>()) {
  if (Array.isArray(node)) {
    return node.map((item) => dereferenceNode(item, document, seen));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  if (typeof node.$ref === 'string') {
    if (seen.has(node.$ref)) {
      return {};
    }
    const resolved = resolveLocalRef(document, node.$ref);
    if (!resolved) {
      return node;
    }
    return dereferenceNode(resolved, document, new Set([...seen, node.$ref]));
  }

  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, dereferenceNode(value, document, seen)]));
}

function readMcpExposure(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value && typeof value === 'object' && 'enabled' in value) {
    const enabled = (value as McpExposure & { enabled?: unknown }).enabled;
    return typeof enabled === 'boolean' ? enabled : undefined;
  }
  return undefined;
}

function resolveMcpExposure(...values: unknown[]) {
  for (const value of values) {
    const exposure = readMcpExposure(value);
    if (typeof exposure === 'boolean') {
      return exposure;
    }
  }
  return true;
}

export function filterSwaggerOperationsForMcp(document: OpenAPIDocument): OpenAPIDocument {
  const paths: OpenAPIV3.PathsObject = {};

  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    if (!pathItem) {
      continue;
    }

    const filteredPathItem: Record<string, unknown> = {};
    for (const key of ['$ref', 'summary', 'description', 'servers', 'parameters'] as const) {
      if (typeof pathItem[key] !== 'undefined') {
        filteredPathItem[key] = pathItem[key];
      }
    }

    let hasOperation = false;
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      if (!resolveMcpExposure(operation['x-mcp'], pathItem['x-mcp'], document['x-mcp'])) {
        continue;
      }
      filteredPathItem[method] = operation;
      hasOperation = true;
    }

    if (hasOperation) {
      paths[path] = filteredPathItem as OpenAPIV3.PathItemObject;
    }
  }

  const filteredDocument = { ...document, paths };
  delete filteredDocument['x-mcp'];
  return filteredDocument;
}

function prepareSwaggerForMcpTools(document: OpenAPIDocument): OpenAPIDocument {
  const swagger = {
    ...document,
    paths: {},
  } as OpenAPIDocument;

  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    if (!pathItem) {
      continue;
    }

    const nextPathItem: Record<string, any> = {
      ...pathItem,
    };

    if (Array.isArray(pathItem.parameters)) {
      nextPathItem.parameters = dereferenceNode(pathItem.parameters, document);
    }

    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      nextPathItem[method] = {
        ...operation,
        parameters: Array.isArray(operation.parameters)
          ? dereferenceNode(operation.parameters, document)
          : operation.parameters,
        requestBody: operation.requestBody ? dereferenceNode(operation.requestBody, document) : operation.requestBody,
      };
    }

    swagger.paths[path] = nextPathItem as any;
  }

  return swagger;
}

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    return path;
  }
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function parseResourceActionFromPath(pathTemplate: string) {
  const normalizedPath = pathTemplate.replace(/^\/+/, '');
  const separatorIndex = normalizedPath.lastIndexOf(':');

  if (separatorIndex === -1) {
    return {};
  }

  const resourcePath = normalizedPath.slice(0, separatorIndex);
  const actionName = normalizedPath.slice(separatorIndex + 1);
  const resourceName = resourcePath
    .split('/')
    .filter((segment) => segment && !segment.startsWith('{'))
    .join('.');

  if (!resourceName || !actionName) {
    return {};
  }

  return {
    resourceName,
    actionName,
  };
}

function buildQueryValue(value: any) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

function formatToolName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[.:\-/\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .replace(/^(get|post|put|delete|patch|options|head|trace)_/, '');
}

export function normalizeMcpToolName(tool: Pick<McpToolDefinitionWithBaseUrl, 'name' | 'pathTemplate'>) {
  const actionMeta = parseResourceActionFromPath(tool.pathTemplate);

  if (actionMeta.resourceName && actionMeta.actionName) {
    return formatToolName(`${actionMeta.resourceName}_${actionMeta.actionName}`);
  }

  return formatToolName(tool.name);
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
      query[parameter.name] = buildQueryValue(value);
      continue;
    }
    if (parameter.in === 'header') {
      if (isMcpIdentityHeader(parameter.name)) {
        continue;
      }
      headers[parameter.name] = String(value);
      continue;
    }
    if (parameter.in === 'cookie') {
      cookies[parameter.name] = String(value);
    }
  }

  Object.assign(headers, buildMcpIdentityHeaders(context));

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getFirstApiError(body: unknown): ApiErrorItem | undefined {
  if (!isRecord(body) || !Array.isArray(body.errors) || !isRecord(body.errors[0])) {
    return undefined;
  }
  return body.errors[0];
}

function createStructuredMcpError(status: number, body: unknown) {
  const apiError = getFirstApiError(body);
  const errorContent: Record<string, unknown> = {
    status,
    code: typeof apiError?.code === 'string' ? apiError.code : 'MCP_HTTP_ERROR',
    message:
      typeof apiError?.message === 'string' ? apiError.message : `NocoBase resource action failed with HTTP ${status}`,
  };

  if (apiError && Object.prototype.hasOwnProperty.call(apiError, 'details')) {
    errorContent.details = apiError.details;
  }

  return new Error(JSON.stringify(errorContent));
}

export async function collectMcpToolsFromSwagger(options: {
  app: Application;
  packagePatterns?: string[];
}): Promise<McpTool[]> {
  const { app, packagePatterns } = options;
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

  if (shouldIncludePackage('@nocobase/server', packagePatterns)) {
    const serverSwagger = loadSwagger('@nocobase/server');
    if (Object.keys(serverSwagger).length > 0) {
      swagger = mergeSwagger(swagger, filterSwaggerOperationsForMcp(serverSwagger as OpenAPIDocument));
    }
  }

  for (const plugin of plugins) {
    const packageName = plugin.get('packageName');
    if (!packageName || !shouldIncludePackage(packageName, packagePatterns)) {
      continue;
    }
    const pluginSwagger = loadSwagger(packageName);
    if (Object.keys(pluginSwagger).length === 0) {
      continue;
    }
    swagger = mergeSwagger(swagger, filterSwaggerOperationsForMcp(pluginSwagger as OpenAPIDocument));
  }

  // Resolve local refs used by tool inputs.
  swagger = prepareSwaggerForMcpTools(swagger);

  const { getToolsFromOpenApi } = await import('openapi-mcp-generator');
  const mcpTools = (await getToolsFromOpenApi(swagger)) as McpToolDefinitionWithBaseUrl[];

  return mcpTools.map((tool) => {
    const actionMeta = parseResourceActionFromPath(tool.pathTemplate);
    const mcpTool: McpTool = {
      name: normalizeMcpToolName(tool),
      description: tool.description,
      resourceName: actionMeta.resourceName,
      actionName: actionMeta.actionName,
      path: tool.pathTemplate,
      method: tool.method.toUpperCase(),
      inputSchema: sanitizeJsonSchemaForOpenAITools(tool.inputSchema),
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
          throw createStructuredMcpError(response.statusCode, body);
        }

        return app.aiManager.mcpToolsManager.postProcessToolResult(mcpTool, body, {
          args,
          callContext: context,
          response: {
            statusCode: response.statusCode,
            headers: response.headers,
            body,
          },
        });
      },
    };

    return mcpTool;
  });
}
