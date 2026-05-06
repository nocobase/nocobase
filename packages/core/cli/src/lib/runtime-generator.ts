/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { loadBuildConfig } from './build-config.js';
import type { GeneratedOperation, GeneratedParameter } from './generated-command.js';
import { toKebabCase, toLogicalActionName, toLogicalResourceName, toResourceSegments } from './naming.js';
import { collectOperations, type OpenApiDocument } from './openapi.js';
import type { StoredRuntime } from './runtime-store.js';

const RESERVED_FLAG_NAMES = new Set(['api-base-url', 'base-url', 'env', 'token', 'json-output', 'body', 'body-file']);

function matchesPattern(value: string, pattern: string) {
  if (!value) {
    return false;
  }

  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }

  return value === pattern;
}

function inferParameterType(schema?: { type?: string; items?: { type?: string }; oneOf?: any[]; anyOf?: any[]; allOf?: any[] }) {
  if (schema?.type) {
    return schema.type;
  }

  for (const candidate of [...(schema?.oneOf ?? []), ...(schema?.anyOf ?? []), ...(schema?.allOf ?? [])]) {
    const resolved = inferParameterType(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

function createUniqueFlagName(baseName: string, usedFlagNames: Set<string>) {
  let candidate = baseName || 'value';
  if (RESERVED_FLAG_NAMES.has(candidate)) {
    candidate = `param-${candidate}`;
  }

  if (!usedFlagNames.has(candidate)) {
    usedFlagNames.add(candidate);
    return candidate;
  }

  let index = 2;
  while (usedFlagNames.has(`${candidate}-${index}`)) {
    index += 1;
  }

  const unique = `${candidate}-${index}`;
  usedFlagNames.add(unique);
  return unique;
}

function isSupportedParameter(parameter: any) {
  return Boolean(parameter && typeof parameter.name === 'string' && typeof parameter.in === 'string');
}

function toGeneratedParameter(parameter: any, usedFlagNames: Set<string>): GeneratedParameter {
  return {
    name: parameter.name,
    flagName: createUniqueFlagName(toKebabCase(parameter.name), usedFlagNames),
    in: parameter.in,
    required: parameter.required,
    description: parameter.description,
    type: inferParameterType(parameter.schema),
    format: parameter.schema?.format,
    isArray: parameter.schema?.type === 'array',
    isFile: parameter.schema?.type === 'string' && parameter.schema?.format === 'binary',
  };
}

function getJsonRequestSchema(requestBody: any) {
  return requestBody?.content?.['application/json']?.schema;
}

function getMultipartRequestSchema(requestBody: any) {
  return requestBody?.content?.['multipart/form-data']?.schema;
}

function getRequestContentType(requestBody: any): 'application/json' | 'multipart/form-data' | undefined {
  if (!requestBody || '$ref' in requestBody) {
    return undefined;
  }

  if (requestBody.content?.['multipart/form-data']) {
    return 'multipart/form-data';
  }

  if (requestBody.content?.['application/json']) {
    return 'application/json';
  }

  return undefined;
}

function getRequestSchema(requestBody: any) {
  return getMultipartRequestSchema(requestBody) ?? getJsonRequestSchema(requestBody);
}

function isBinarySchema(schema: any): boolean {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (schema.type === 'string' && schema.format === 'binary') {
    return true;
  }

  return [...(schema.oneOf ?? []), ...(schema.anyOf ?? []), ...(schema.allOf ?? [])].some(isBinarySchema);
}

function getResponseType(operation: any): 'json' | 'binary' | undefined {
  for (const response of Object.values<any>(operation.responses ?? {})) {
    const content = response?.content ?? {};
    const mediaTypes = Object.keys(content);
    const hasJson = mediaTypes.some((mediaType) => mediaType.includes('json'));
    if (hasJson) {
      return 'json';
    }

    const hasBinary = mediaTypes.some((mediaType) => {
      const schema = content[mediaType]?.schema;
      return mediaType === 'application/octet-stream' || mediaType.includes('zip') || isBinarySchema(schema);
    });
    if (hasBinary) {
      return 'binary';
    }
  }

  return undefined;
}

function normalizeCompositeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return schema.allOf.reduce(
      (result: Record<string, any>, part: any) => {
        const normalized = normalizeCompositeSchema(part);
        return {
          ...result,
          ...normalized,
          type: normalized?.type ?? result.type ?? 'object',
          properties: {
            ...(result.properties ?? {}),
            ...(normalized?.properties ?? {}),
          },
          required: [...new Set([...(result.required ?? []), ...(normalized?.required ?? [])])],
          additionalProperties: normalized?.additionalProperties ?? result.additionalProperties,
          description: schema.description ?? normalized?.description ?? result.description,
        };
      },
      { type: 'object' },
    );
  }

  return schema;
}

function describeSchemaShape(schema: any, options: { depth?: number; maxDepth?: number; maxProperties?: number } = {}): string | undefined {
  if (!schema) {
    return undefined;
  }

  const normalizedSchema = normalizeCompositeSchema(schema);

  if (Array.isArray(normalizedSchema?.oneOf) || Array.isArray(normalizedSchema?.anyOf)) {
    const variants = (normalizedSchema.oneOf ?? normalizedSchema.anyOf)
      .map((candidate: any) => describeSchemaShape(candidate, options))
      .filter(Boolean);
    return [...new Set(variants)].join(' | ') || 'value';
  }

  if (normalizedSchema.$ref && typeof normalizedSchema.$ref === 'string') {
    return normalizedSchema.$ref.split('/').pop();
  }

  const depth = options.depth ?? 0;
  const maxDepth = options.maxDepth ?? 2;
  const maxProperties = options.maxProperties ?? 6;
  const type =
    inferParameterType(normalizedSchema) ??
    (normalizedSchema.properties ? 'object' : undefined) ??
    (normalizedSchema.items ? 'array' : undefined) ??
    (normalizedSchema.additionalProperties ? 'object' : undefined);

  if (!type) {
    return 'value';
  }

  if (type === 'array') {
    const itemShape = describeSchemaShape(normalizedSchema.items, {
      depth: depth + 1,
      maxDepth,
      maxProperties,
    });
    return itemShape ? `[${itemShape}]` : '[]';
  }

  if (type === 'object') {
    const properties = Object.entries<any>(normalizedSchema.properties ?? {});
    if (!properties.length) {
      return undefined;
    }

    const required = new Set<string>(normalizedSchema.required ?? []);
    const sortedProperties = [...properties].sort(([left], [right]) => Number(required.has(right)) - Number(required.has(left)));

    return `{${sortedProperties
      .slice(0, maxProperties)
      .map(([name, propertySchema]) => {
        const nestedShape =
          depth + 1 < maxDepth ? describeSchemaShape(propertySchema, { depth: depth + 1, maxDepth, maxProperties }) : undefined;
        return `${name}${required.has(name) ? '' : '?'}: ${nestedShape ?? inferParameterType(propertySchema) ?? 'value'}`;
      })
      .join(', ')}${sortedProperties.length > maxProperties ? ', ...' : ''}}`;
  }

  return type;
}

function extractBodyParameters(requestBody: any, usedFlagNames: Set<string>) {
  const schema = getRequestSchema(requestBody);
  const properties = normalizeCompositeSchema(schema)?.properties;
  const required = new Set<string>(normalizeCompositeSchema(schema)?.required ?? []);

  return Object.entries<any>(properties ?? {}).map(([name, propertySchema]) => ({
    name,
    flagName: createUniqueFlagName(toKebabCase(name), usedFlagNames),
    in: 'body' as const,
    required: required.has(name),
    description: propertySchema.description,
    type: inferParameterType(propertySchema),
    format: propertySchema.format,
    isArray: propertySchema.type === 'array',
    isFile: propertySchema.type === 'string' && propertySchema.format === 'binary',
    jsonEncoded: propertySchema.type === 'object' || propertySchema.type === 'array',
    jsonShape: describeSchemaShape(propertySchema),
  }));
}

function splitParagraphs(value?: string) {
  return (value ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveOperationText(operation: { summary?: string; description?: string }) {
  const swaggerSummary = operation.summary?.trim() || undefined;
  const descriptionParagraphs = splitParagraphs(operation.description?.trim());

  if (descriptionParagraphs.length > 0) {
    const [summary, ...rest] = descriptionParagraphs;
    return {
      summary,
      description: rest.join('\n\n') || (swaggerSummary && swaggerSummary !== summary ? swaggerSummary : undefined),
    };
  }

  return {
    summary: swaggerSummary,
    description: undefined,
  };
}

function formatFlagExample(parameter: GeneratedParameter) {
  if (parameter.type === 'boolean') {
    return `--${parameter.flagName}`;
  }

  if (parameter.isFile) {
    return `--${parameter.flagName} <path>`;
  }

  if (parameter.type === 'object' || parameter.jsonEncoded) {
    if (parameter.type === 'array' || parameter.isArray) {
      return `--${parameter.flagName} '[]'`;
    }

    return `--${parameter.flagName} '{\"key\":\"value\"}'`;
  }

  if (parameter.isArray) {
    return `--${parameter.flagName} value1 --${parameter.flagName} value2`;
  }

  return `--${parameter.flagName} <value>`;
}

function getSampleJsonValue(parameter: GeneratedParameter): unknown {
  if (parameter.type === 'boolean') {
    return true;
  }

  if (parameter.type === 'integer' || parameter.type === 'number') {
    return 1;
  }

  if (parameter.type === 'array') {
    return [];
  }

  if (parameter.type === 'object') {
    return { key: 'value' };
  }

  return 'value';
}

function buildSampleBody(parameters: GeneratedParameter[]) {
  const requiredBodyParameters = parameters.filter((parameter) => parameter.in === 'body' && parameter.required);
  if (!requiredBodyParameters.length) {
    return '{"key":"value"}';
  }

  return JSON.stringify(
    Object.fromEntries(requiredBodyParameters.map((parameter) => [parameter.name, getSampleJsonValue(parameter)])),
  );
}

export function buildExamples(commandId: string, operation: { parameters: GeneratedParameter[]; hasBody?: boolean; requestContentType?: string; responseType?: string }) {
  const requiredParameters = operation.parameters.filter((parameter) => parameter.required);
  const requiredFlags = requiredParameters.map(formatFlagExample);
  const requiredNonBodyFlags = requiredParameters.filter((parameter) => parameter.in !== 'body').map(formatFlagExample);
  const outputFlag = operation.responseType === 'binary' ? ' --output <path>' : '';
  const examples = [`nb api ${commandId}${requiredFlags.length ? ` ${requiredFlags.join(' ')}` : ''}${outputFlag}`];
  const firstOptional = operation.parameters.find((parameter) => !parameter.required);

  if (firstOptional) {
    examples.push(`${examples[0]} ${formatFlagExample(firstOptional)}`.trim());
  }

  if (operation.hasBody && operation.requestContentType !== 'multipart/form-data') {
    const prefix = `nb api ${commandId}${requiredNonBodyFlags.length ? ` ${requiredNonBodyFlags.join(' ')}` : ''}`;
    examples.push(`${prefix} --body '${buildSampleBody(operation.parameters)}'`);
  }

  return [...new Set(examples)];
}

function buildDescription(operation: {
  moduleDisplayName?: string;
  moduleDescription?: string;
  resourceDisplayName?: string;
  resourceDescription?: string;
  method: string;
  pathTemplate: string;
  tags?: string[];
  description?: string;
  hasBody?: boolean;
  requestContentType?: string;
  responseType?: string;
  parameters: GeneratedParameter[];
}) {
  const sections: string[] = [];

  if (operation.description) {
    sections.push(operation.description);
  }

  if (operation.moduleDisplayName || operation.moduleDescription) {
    sections.push(
      [operation.moduleDisplayName ? `Module: ${operation.moduleDisplayName}` : undefined, operation.moduleDescription]
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (operation.resourceDisplayName || operation.resourceDescription) {
    sections.push(
      [operation.resourceDisplayName ? `Resource: ${operation.resourceDisplayName}` : undefined, operation.resourceDescription]
        .filter(Boolean)
        .join('\n'),
    );
  }

  sections.push(`HTTP ${operation.method.toUpperCase()} ${operation.pathTemplate}`);
  if (operation.tags?.length) {
    sections.push(`Tags: ${operation.tags.join(', ')}`);
  }

  if (operation.hasBody) {
    const bodyFlags = operation.parameters.filter((parameter) => parameter.in === 'body').map((parameter) => `--${parameter.flagName}`);
    if (operation.requestContentType === 'multipart/form-data') {
      sections.push(bodyFlags.length ? `Request body: multipart form fields (${bodyFlags.join(', ')}).` : 'Request body: multipart form data.');
    } else {
      sections.push(
        bodyFlags.length
          ? `Request body: use body field flags (${bodyFlags.join(', ')}) or pass raw JSON via \`--body\` / \`--body-file\`.`
          : 'Request body: JSON via `--body` or `--body-file`.',
      );
    }
  }

  if (operation.responseType === 'binary') {
    sections.push('Response body: binary download written to `--output`.');
  }

  return sections.join('\n\n');
}

function shouldIncludeResource(resourceKey: string | undefined, moduleConfig: { resources?: { includes?: string[]; excludes?: string[] } }) {
  if (!resourceKey) {
    return false;
  }

  const includes = moduleConfig.resources?.includes;
  const excludes = moduleConfig.resources?.excludes;

  if (includes?.length && !includes.some((pattern) => matchesPattern(resourceKey, pattern))) {
    return false;
  }

  if (excludes?.length && excludes.some((pattern) => matchesPattern(resourceKey, pattern))) {
    return false;
  }

  return true;
}

function getPrimaryResourceKey(pathTemplate: string) {
  return pathTemplate
    .replace(/^\/+/, '')
    .split(/[/:]/)
    .find((segment) => segment && !segment.startsWith('{'));
}

function getOperationMatchKeys(operation: { method: string; pathTemplate: string; operationId?: string }) {
  const normalizedPath = operation.pathTemplate.replace(/^\/+/, '');
  const action = normalizedPath.includes(':') ? normalizedPath.slice(normalizedPath.lastIndexOf(':') + 1) : 'call';
  const resourcePath = normalizedPath.includes(':') ? normalizedPath.slice(0, normalizedPath.lastIndexOf(':')) : normalizedPath;

  return [
    action,
    operation.operationId,
    operation.pathTemplate,
    `${resourcePath}:${action}`,
    `${operation.method.toLowerCase()}:${operation.pathTemplate}`,
    `${operation.method.toUpperCase()}:${operation.pathTemplate}`,
  ].filter((value): value is string => Boolean(value));
}

function shouldIncludeOperation(
  operation: { method: string; pathTemplate: string; operationId?: string },
  resourceConfig?: { operations?: { includes?: string[]; excludes?: string[] } },
) {
  const includes = resourceConfig?.operations?.includes;
  const excludes = resourceConfig?.operations?.excludes;
  const matchKeys = getOperationMatchKeys(operation);

  if (includes?.length && !includes.some((pattern) => matchKeys.some((value) => matchesPattern(value, pattern)))) {
    return false;
  }

  if (excludes?.length && excludes.some((pattern) => matchKeys.some((value) => matchesPattern(value, pattern)))) {
    return false;
  }

  return true;
}

function scoreModuleMatch(
  moduleKey: string,
  moduleConfig: any,
  resourceKey: string | undefined,
  operation: { method: string; pathTemplate: string; operationId?: string; tags?: string[] },
) {
  if (!shouldIncludeResource(resourceKey, moduleConfig)) {
    return -1;
  }

  const resourceConfig = resourceKey ? moduleConfig.resources?.overrides?.[resourceKey] : undefined;
  if (!shouldIncludeOperation(operation, resourceConfig)) {
    return -1;
  }

  let score = 10;
  if (resourceConfig?.operations?.includes?.length) {
    score += 100;
  }

  const moduleResourceNames = new Set(
    Object.entries<any>(moduleConfig.resources?.overrides ?? {}).flatMap(([resourceName, resourceConfigValue]) => [
      toKebabCase(resourceName),
      toKebabCase(resourceConfigValue?.name ?? resourceName),
    ]),
  );
  const tagTokens = (operation.tags ?? []).flatMap((tag) => tag.split(/[./:]/).map((part) => toKebabCase(part)).filter(Boolean));
  const tokenMatches = tagTokens.filter((token) => moduleResourceNames.has(token));
  score += tokenMatches.length * 5;

  if (operation.pathTemplate.includes('/desktopRoutes')) {
    score += moduleKey === 'client' ? 20 : 0;
  }

  return score;
}

function resolveModuleKey(buildConfig: Awaited<ReturnType<typeof loadBuildConfig>>, operation: { method: string; pathTemplate: string; operationId?: string; tags?: string[] }) {
  const resourceKey = getPrimaryResourceKey(operation.pathTemplate);
  const candidates = Object.entries(buildConfig.modules ?? {})
    .filter(([, moduleConfig]) => moduleConfig.include !== false)
    .map(([moduleKey, moduleConfig]) => ({
      moduleKey,
      moduleConfig,
      score: scoreModuleMatch(moduleKey, moduleConfig, resourceKey, operation),
    }))
    .filter((item) => item.score >= 0)
    .sort((left, right) => right.score - left.score);

  return candidates[0];
}

export async function generateRuntime(document: OpenApiDocument, configFile: string, baseUrl?: string): Promise<StoredRuntime> {
  const buildConfig = await loadBuildConfig(configFile);
  const commands: GeneratedOperation[] = [];

  for (const { method, pathTemplate, operation } of collectOperations(document)) {
    const resolvedModule = resolveModuleKey(buildConfig, {
      method,
      pathTemplate,
      operationId: operation.operationId,
      tags: operation.tags,
    });

    if (!resolvedModule) {
      continue;
    }

    const { moduleKey, moduleConfig } = resolvedModule;
    const resourceKey = getPrimaryResourceKey(pathTemplate);
    const resourceConfig = resourceKey ? moduleConfig.resources?.overrides?.[resourceKey] : undefined;
    const usedFlagNames = new Set<string>();
    const parameters = (operation.parameters ?? []).filter(isSupportedParameter).map((parameter) => toGeneratedParameter(parameter, usedFlagNames));
    const bodyParameters = extractBodyParameters(operation.requestBody, usedFlagNames);
    const allParameters = [...parameters, ...bodyParameters];
    const hasBody = Boolean(operation.requestBody && !('$ref' in operation.requestBody));
    const requestContentType = getRequestContentType(operation.requestBody);
    const responseType = getResponseType(operation);
    const moduleDisplayName = moduleConfig.name ?? moduleKey;
    const moduleDescription = moduleConfig.description;
    const resourceDisplayName = resourceConfig?.name ?? resourceKey;
    const resourceDescription = resourceConfig?.description;
    const operationText = resolveOperationText({
      summary: operation.summary,
      description: operation.description,
    });
    const resourceSegments = toResourceSegments(pathTemplate);
    const mappedResourceSegments =
      resourceSegments.length && resourceConfig?.segments?.length
        ? [...resourceConfig.segments.map(toKebabCase), ...resourceSegments.slice(1)]
        : resourceSegments.length && resourceConfig?.name
          ? [toKebabCase(resourceConfig.name), ...resourceSegments.slice(1)]
          : resourceSegments;
    const segments = [
      ...(resourceConfig?.topLevel ? [] : [toKebabCase(moduleDisplayName)]),
      ...mappedResourceSegments,
    ];

    commands.push({
      moduleName: moduleKey,
      moduleDisplayName,
      moduleDescription,
      resourceName: resourceKey,
      logicalResourceName: toLogicalResourceName(pathTemplate),
      actionName: toLogicalActionName(pathTemplate),
      resourceDisplayName,
      resourceDescription,
      commandId: segments.join(' '),
      method,
      pathTemplate,
      tags: operation.tags,
      summary: operationText.summary ?? `${method.toUpperCase()} ${pathTemplate}`,
      description: buildDescription({
        moduleDisplayName: resourceConfig?.topLevel ? undefined : moduleDisplayName,
        moduleDescription: resourceConfig?.topLevel ? undefined : moduleDescription,
        resourceDisplayName,
        resourceDescription,
        method,
        pathTemplate,
        tags: operation.tags,
        description: operationText.description,
        hasBody,
        requestContentType,
        responseType,
        parameters: allParameters,
      }),
      examples: buildExamples(segments.join(' '), {
        parameters: allParameters,
        hasBody,
        requestContentType,
        responseType,
      }),
      parameters: allParameters,
      hasBody,
      bodyRequired: operation.requestBody && !('$ref' in operation.requestBody) ? operation.requestBody.required : undefined,
      requestContentType,
      responseType,
    });
  }

  const schemaHash = createHash('sha1').update(JSON.stringify(document)).digest('hex').slice(0, 8);

  return {
    version: String(document.info?.version ?? 'unknown'),
    schemaHash,
    generatedAt: new Date().toISOString(),
    baseUrl,
    commands: commands.sort((left, right) => left.commandId.localeCompare(right.commandId)),
  };
}
