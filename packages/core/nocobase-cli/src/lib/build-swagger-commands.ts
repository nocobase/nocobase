/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {loadBuildConfig} from './build-config';
import {collectOperations, discoverSwaggerSources, loadSwaggerDocument, sha1File} from './openapi';
import {
  splitPathAction,
  toClassName,
  toCommandSegments,
  toImportPath,
  toKebabCase,
  toLogicalActionName,
  toLogicalResourceName,
  toOutputFile,
  toResourceSegments,
} from './naming';
import type {GeneratedOperation, GeneratedParameter} from './generated-command';

interface GeneratedManifestEntry {
  hash: string;
  outputs: string[];
}

interface GeneratedManifest {
  version: number;
  files: Record<string, GeneratedManifestEntry>;
}

const MANIFEST_VERSION = 3;
const RESERVED_FLAG_NAMES = new Set(['base-url', 'profile', 'token', 'json-output', 'body', 'body-file']);

function inferParameterType(schema?: {type?: string; items?: {type?: string}; oneOf?: any[]; anyOf?: any[]; allOf?: any[]}): string | undefined {
  if (schema?.type) {
    return schema.type;
  }

  for (const candidate of [...(schema?.oneOf ?? []), ...(schema?.anyOf ?? []), ...(schema?.allOf ?? [])]) {
    const resolved: string | undefined = inferParameterType(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
}

function toGeneratedParameter(parameter: any, usedFlagNames?: Set<string>): GeneratedParameter {
  const baseFlagName = toKebabCase(parameter.name);
  const flagName = createUniqueFlagName(baseFlagName, usedFlagNames);
  return {
    name: parameter.name,
    flagName,
    in: parameter.in,
    required: parameter.required,
    description: parameter.description,
    type: inferParameterType(parameter.schema),
    isArray: parameter.schema?.type === 'array',
  };
}

function isSupportedParameter(parameter: any) {
  return Boolean(parameter && typeof parameter.name === 'string' && typeof parameter.in === 'string');
}

function escapeDescription(value?: string) {
  return value?.trim() || undefined;
}

function createUniqueFlagName(baseName: string, usedFlagNames?: Set<string>) {
  const normalized = baseName || 'value';

  if (!usedFlagNames) {
    return normalized;
  }

  let candidate = normalized;
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

function toOperationActionName(pathTemplate: string) {
  const resourceSegments = toResourceSegments(pathTemplate);
  return resourceSegments.at(-1);
}

function formatFlagExample(parameter: GeneratedParameter) {
  if (parameter.type === 'boolean') {
    return `--${parameter.flagName}`;
  }

  if (parameter.type === 'object') {
    return `--${parameter.flagName} '{"key":"value"}'`;
  }

  if (parameter.isArray) {
    return `--${parameter.flagName} value1 --${parameter.flagName} value2`;
  }

  return `--${parameter.flagName} <value>`;
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
  parameters: GeneratedParameter[];
  requestBodySchema?: any;
}) {
  const sections: string[] = [];

  if (operation.description) {
    sections.push(operation.description);
  }

  if (operation.moduleDisplayName || operation.moduleDescription) {
    sections.push(
      [
        operation.moduleDisplayName ? `Module: ${operation.moduleDisplayName}` : undefined,
        operation.moduleDescription,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  if (operation.resourceDisplayName || operation.resourceDescription) {
    sections.push(
      [
        operation.resourceDisplayName ? `Resource: ${operation.resourceDisplayName}` : undefined,
        operation.resourceDescription,
      ]
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
    sections.push(
      bodyFlags.length
        ? `Request body: use body field flags (${bodyFlags.join(', ')}) or pass raw JSON via \`--body\` / \`--body-file\`.`
        : 'Request body: JSON via `--body` or `--body-file`.',
    );
  }

  const requiredFlags = operation.parameters.filter((parameter) => parameter.required).map((parameter) => `--${parameter.flagName}`);
  if (requiredFlags.length) {
    sections.push(`Required flags: ${requiredFlags.join(', ')}`);
  }

  return sections.join('\n\n');
}

function buildExamples(commandId: string, operation: {parameters: GeneratedParameter[]; hasBody?: boolean}) {
  const requiredFlags = operation.parameters.filter((parameter) => parameter.required).map(formatFlagExample);
  const exampleBase = `nocobase-cli ${commandId}`;
  const examples = [`${exampleBase}${requiredFlags.length ? ` ${requiredFlags.join(' ')}` : ''}`];

  const firstOptional = operation.parameters.find((parameter) => !parameter.required);
  if (firstOptional) {
    examples.push(`${examples[0]} ${formatFlagExample(firstOptional)}`);
  }

  if (operation.hasBody) {
    examples.push(`${examples[0]} --body '{"key":"value"}'`);
  }

  return [...new Set(examples)];
}

function splitParagraphs(value?: string) {
  return (value ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveOperationText(operation: {summary?: string; description?: string}) {
  const swaggerSummary = escapeDescription(operation.summary);
  const descriptionParagraphs = splitParagraphs(escapeDescription(operation.description));

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

function shortHash(input: string) {
  return createHash('sha1').update(input).digest('hex').slice(0, 6);
}

function getJsonRequestSchema(requestBody: any) {
  return requestBody?.content?.['application/json']?.schema;
}

function normalizeCompositeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return schema.allOf.reduce(
      (result: Record<string, any>, part: any) => {
        const normalized = normalizeCompositeSchema(part);
        const properties = {
          ...(result.properties ?? {}),
          ...(normalized?.properties ?? {}),
        };
        const required = [...new Set([...(result.required ?? []), ...(normalized?.required ?? [])])];

        return {
          ...result,
          ...normalized,
          type: normalized?.type ?? result.type ?? 'object',
          properties,
          required,
          additionalProperties: normalized?.additionalProperties ?? result.additionalProperties,
          description: schema.description ?? normalized?.description ?? result.description,
        };
      },
      {type: 'object'},
    );
  }

  return schema;
}

function describeSchemaShape(
  schema: any,
  options: { depth?: number; maxDepth?: number; maxProperties?: number } = {},
): string | undefined {
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

    if (depth >= maxDepth) {
      return `{${sortedProperties
        .slice(0, maxProperties)
        .map(([name, propertySchema]) => `${name}: ${inferParameterType(propertySchema) ?? 'value'}`)
        .join(', ')}${sortedProperties.length > maxProperties ? ', ...' : ''}}`;
    }

    return `{${sortedProperties
      .slice(0, maxProperties)
      .map(([name, propertySchema]) => {
        return `${name}: ${describeSchemaShape(propertySchema, {
          depth: depth + 1,
          maxDepth,
          maxProperties,
        }) ?? inferParameterType(propertySchema) ?? 'value'}`;
      })
      .join(', ')}${sortedProperties.length > maxProperties ? ', ...' : ''}}`;
  }

  return type;
}

function normalizeDisplayedJsonShape(shape?: string) {
  if (!shape) {
    return undefined;
  }

  const normalized = shape.trim();
  if (!normalized || normalized === '{...}' || normalized === '{}') {
    return undefined;
  }

  return normalized;
}

function extractBodyParameters(requestBody: any, usedFlagNames: Set<string>) {
  const schema = getJsonRequestSchema(requestBody);
  if (!schema || inferParameterType(schema) !== 'object' || !schema.properties) {
    return [];
  }

  const required = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
  const parameters: GeneratedParameter[] = [];

  for (const [name, propertySchema] of Object.entries<any>(schema.properties)) {
    const type = inferParameterType(propertySchema);
    const isComplex = type === 'object' || type === 'array' || !type;
    parameters.push({
      name,
      flagName: createUniqueFlagName(toKebabCase(name), usedFlagNames),
      in: 'body',
      required: required.has(name),
      description: propertySchema?.description,
      type: type ?? 'object',
      isArray: type === 'array' && !isComplex,
      jsonEncoded: isComplex,
      jsonShape: isComplex ? normalizeDisplayedJsonShape(describeSchemaShape(propertySchema)) : undefined,
    });
  }

  return parameters;
}

function renderCommandSource(operation: GeneratedOperation, outputFile: string) {
  const className = toClassName(operation.commandId.split(' '));
  const normalizedOutputFile = outputFile.replace(/\\/g, '/');
  const generatedRootMarker = '/src/generated/';
  const markerIndex = normalizedOutputFile.indexOf(generatedRootMarker);
  const generatedCommandFile =
    markerIndex >= 0
      ? `${normalizedOutputFile.slice(0, markerIndex)}/src/lib/generated-command.js`
      : path.join(process.cwd(), 'src/lib/generated-command.js');
  const importPath = toImportPath(outputFile, generatedCommandFile);

  return `/**
 * This file is autogenerated by \`nocobase build swagger\`.
 * Do not edit manually.
 */

import {createGeneratedFlags, GeneratedApiCommand} from '${importPath}';
import type {GeneratedOperation} from '${importPath}';

const operation: GeneratedOperation = ${JSON.stringify(operation, null, 2)};

export default class ${className} extends GeneratedApiCommand {
  static summary = operation.summary;
  static description = operation.description;
  static examples = operation.examples as any;
  static flags = createGeneratedFlags(operation);
  static operation = operation;
}
`;
}

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), {recursive: true});
}

async function loadManifest(filePath: string): Promise<GeneratedManifest> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const manifest = JSON.parse(content) as GeneratedManifest;
    if (manifest.version !== MANIFEST_VERSION) {
      return {
        version: MANIFEST_VERSION,
        files: {},
      };
    }

    return manifest;
  } catch (error) {
    return {
      version: MANIFEST_VERSION,
      files: {},
    };
  }
}

function toRelativePath(filePath: string) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function toAbsolutePath(relativePath: string) {
  return path.resolve(process.cwd(), relativePath);
}

function ensureSubtopicNode(root: Record<string, any>, segments: string[], description?: string) {
  let cursor = root;

  for (const [index, segment] of segments.entries()) {
    const existing = cursor[segment] ?? {};
    cursor[segment] = existing;

    if (index === segments.length - 1 && description && !existing.description) {
      existing.description = description;
    }

    existing.subtopics ??= {};
    cursor = existing.subtopics;
  }
}

async function syncOclifTopics(
  packageJsonFile: string,
  buildConfig: Awaited<ReturnType<typeof loadBuildConfig>>,
  manualTopicsFile?: string,
) {
  const content = await fs.readFile(packageJsonFile, 'utf8');
  const pkg = JSON.parse(content) as Record<string, any>;
  const topics: Record<string, any> = {};

  for (const [moduleKey, moduleConfig] of Object.entries(buildConfig.modules ?? {})) {
    if (moduleConfig.include === false) {
      continue;
    }

    const moduleTopicName = toKebabCase(moduleConfig.name ?? moduleKey);
    const moduleTopic: Record<string, any> = {};
    if (moduleConfig.description) {
      moduleTopic.description = moduleConfig.description;
    }

    const subtopics: Record<string, any> = {};
    for (const [resourceKey, resourceConfig] of Object.entries(moduleConfig.resources?.overrides ?? {})) {
      if (!shouldIncludeResource(resourceKey, moduleConfig)) {
        continue;
      }

      const resourceName = toKebabCase(resourceConfig.name ?? resourceKey);
      const resourceDescription = resourceConfig.description || `Commands for ${resourceName}.`;

      if (resourceConfig.topLevel) {
        topics[resourceName] = {
          description: resourceDescription,
        };
      } else {
        ensureSubtopicNode(subtopics, resourceName.split('.'), resourceDescription);
      }

      for (const pattern of resourceConfig.operations?.includes ?? []) {
        const normalizedPattern = pattern.replace(/^[A-Z]+:/, '').replace(/^\/+/, '');
        if (!normalizedPattern.includes('/')) {
          continue;
        }

        const { resourcePath } = splitPathAction(normalizedPattern);
        const segments = resourcePath
          .split('/')
          .filter(Boolean)
          .filter((segment) => !segment.startsWith('{'))
          .map((segment) => toKebabCase(segment));

        if (segments.length <= 1) {
          continue;
        }

        ensureSubtopicNode(
          subtopics,
          segments,
          segments.at(-1) === 'fields' ? 'Manage fields within a collection.' : `Commands for ${segments.at(-1)}.`,
        );
      }
    }

    if (Object.keys(subtopics).length > 0) {
      moduleTopic.subtopics = subtopics;
    }

    topics[moduleTopicName] = moduleTopic;
  }

  if (manualTopicsFile) {
    try {
      const manualTopicsContent = await fs.readFile(manualTopicsFile, 'utf8');
      Object.assign(topics, JSON.parse(manualTopicsContent) as Record<string, any>);
    } catch (error) {
      // Ignore missing manual topics file.
    }
  }

  pkg.oclif = {
    ...(pkg.oclif ?? {}),
    topics,
  };

  await fs.writeFile(packageJsonFile, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function collectCommandSourceFiles(root: string) {
  const files: string[] = [];

  async function walk(dir: string) {
    let entries: Array<{isDirectory(): boolean; isFile(): boolean; name: string}>;
    try {
      entries = await fs.readdir(dir, {withFileTypes: true}) as Array<{isDirectory(): boolean; isFile(): boolean; name: string}>;
    } catch (error) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  await walk(root);
  return files.sort();
}

function toCommandRegistryKey(root: string, filePath: string) {
  const relativePath = path.relative(root, filePath).replace(/\\/g, '/');
  return relativePath.replace(/\.ts$/, '').split('/').join(':');
}

async function syncCommandRegistry(commandRegistryFile: string, roots: string[]) {
  const allFiles = (await Promise.all(roots.map((root) => collectCommandSourceFiles(root)))).flat().sort();
  const imports: string[] = [];
  const entries: string[] = [];

  for (const [index, filePath] of allFiles.entries()) {
    const importName = `Command${index + 1}`;
    const importPath = toImportPath(commandRegistryFile, filePath).replace(/\.ts$/, '.js');
    const root = roots.find((candidate) => filePath.startsWith(candidate));
    if (!root) {
      continue;
    }

    imports.push(`import ${importName} from '${importPath}';`);
    entries.push(`  '${toCommandRegistryKey(root, filePath)}': ${importName},`);
  }

  const content = `${imports.join('\n')}

export default {
${entries.join('\n')}
};
`;

  await fs.mkdir(path.dirname(commandRegistryFile), {recursive: true});
  await fs.writeFile(commandRegistryFile, content);
}

export interface BuildSwaggerCommandsOptions {
  sourceRoot: string;
  outputRoot: string;
  manualCommandsRoot: string;
  commandRegistryFile: string;
  manualTopicsFile?: string;
  manifestFile: string;
  configFile: string;
  packageJsonFile: string;
  full?: boolean;
}

interface PackageMetadata {
  displayName?: string;
  description?: string;
}

function shouldIncludeResource(resourceKey: string | undefined, moduleConfig: {resources?: {includes?: string[]; excludes?: string[]}}) {
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

function getOperationMatchKeys(operation: {method: string; pathTemplate: string; operationId?: string}) {
  const action = toOperationActionName(operation.pathTemplate);
  const { resourcePath } = splitPathAction(operation.pathTemplate);
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
  operation: {method: string; pathTemplate: string; operationId?: string},
  resourceConfig?: {operations?: {includes?: string[]; excludes?: string[]}},
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

function getOperationOverride(
  operation: {method: string; pathTemplate: string; operationId?: string},
  resourceConfig?: {operations?: {overrides?: Record<string, {description?: string}>}},
) {
  const overrides = resourceConfig?.operations?.overrides;
  if (!overrides) {
    return undefined;
  }

  const matchKeys = getOperationMatchKeys(operation);
  for (const [pattern, override] of Object.entries(overrides)) {
    if (matchKeys.some((value) => matchesPattern(value, pattern))) {
      return override;
    }
  }

  return undefined;
}

function matchesPattern(value: string, pattern: string) {
  if (!value) {
    return false;
  }

  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }

  return value === pattern;
}

function resolveLogicalModuleName(
  source: {moduleName: string; packageName?: string},
  buildConfig: Awaited<ReturnType<typeof loadBuildConfig>>,
) {
  const group = buildConfig.moduleGroups?.find((item) =>
    item.match.some((pattern) => matchesPattern(source.moduleName, pattern) || matchesPattern(source.packageName ?? '', pattern)),
  );

  return group?.module ?? source.moduleName;
}

async function loadPackageMetadata(filePath?: string): Promise<PackageMetadata> {
  if (!filePath) {
    return {};
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const pkg = JSON.parse(content) as Record<string, any>;
    return {
      displayName: pkg.displayName ?? pkg.name,
      description: pkg.description,
    };
  } catch (error) {
    return {};
  }
}

async function sha1OptionalFile(filePath?: string) {
  if (!filePath) {
    return '';
  }

  try {
    return await sha1File(filePath);
  } catch (error) {
    return '';
  }
}

function getPrimaryResourceKey(pathTemplate: string) {
  const {resourcePath} = splitPathAction(pathTemplate);
  return resourcePath
    .split('/')
    .find((segment) => segment && !segment.startsWith('{'));
}

export async function buildSwaggerCommands(options: BuildSwaggerCommandsOptions) {
  const sources = await discoverSwaggerSources(options.sourceRoot);
  const buildConfig = await loadBuildConfig(options.configFile);
  const configHash = await sha1OptionalFile(options.configFile);
  await syncOclifTopics(options.packageJsonFile, buildConfig, options.manualTopicsFile);
  const previousManifest = await loadManifest(options.manifestFile);
  const nextManifest: GeneratedManifest = {
    version: MANIFEST_VERSION,
    files: {},
  };
  const nextOutputs = new Set<string>();
  const claimedOutputs = new Map<string, string>();

  for (const source of sources) {
    const logicalModuleName = resolveLogicalModuleName(source, buildConfig);
    const packageMetadata = await loadPackageMetadata(source.packageFile);
    const moduleConfig = buildConfig.modules?.[logicalModuleName];
    if (!moduleConfig || moduleConfig.include === false) {
      continue;
    }

    const sourceHash = await sha1File(source.sourceFile);
    const packageHash = await sha1OptionalFile(source.packageFile);
    const hash = createHash('sha1')
      .update(sourceHash)
      .update(packageHash)
      .update(configHash)
      .digest('hex');
    const previousEntry = previousManifest.files[source.sourceId];

    if (!options.full && previousEntry?.hash === hash) {
      nextManifest.files[source.sourceId] = previousEntry;
      previousEntry.outputs.map(toAbsolutePath).forEach((output) => nextOutputs.add(output));
      continue;
    }

    const document = await loadSwaggerDocument(source);
    const outputs: string[] = [];

    for (const {method, pathTemplate, operation} of collectOperations(document)) {
      const resourceKey = getPrimaryResourceKey(pathTemplate);
      if (!shouldIncludeResource(resourceKey, moduleConfig)) {
        continue;
      }
      const resourceConfig = resourceKey ? moduleConfig.resources?.overrides?.[resourceKey] : undefined;
      if (!shouldIncludeOperation({method, pathTemplate, operationId: operation.operationId}, resourceConfig)) {
        continue;
      }
      const operationOverride = getOperationOverride({method, pathTemplate, operationId: operation.operationId}, resourceConfig);

      const fingerprint = `${method}:${pathTemplate}`;
      const moduleCommandName = moduleConfig?.name ?? logicalModuleName;
      const resourceSegments = toResourceSegments(pathTemplate);
      const mappedResourceSegments =
        resourceSegments.length && resourceConfig?.name
          ? [toKebabCase(resourceConfig.name), ...resourceSegments.slice(1)]
          : resourceSegments;
      let segments = [
        ...(resourceConfig?.topLevel ? [] : [toKebabCase(moduleCommandName)]),
        ...mappedResourceSegments,
      ];
      if (!segments.length) {
        segments = toCommandSegments(moduleCommandName, pathTemplate);
      }
      let outputFile = toOutputFile(options.outputRoot, segments);
      const existingFingerprint = claimedOutputs.get(outputFile);

      if (existingFingerprint && existingFingerprint !== fingerprint) {
        const fallbackResourceSegments = toResourceSegments(pathTemplate, {includeParams: true});
        const mappedFallbackSegments =
          fallbackResourceSegments.length && resourceConfig?.name
            ? [toKebabCase(resourceConfig.name), ...fallbackResourceSegments.slice(1)]
            : fallbackResourceSegments;
        segments = [
          ...(resourceConfig?.topLevel ? [] : [toKebabCase(moduleCommandName)]),
          ...mappedFallbackSegments,
        ];
        outputFile = toOutputFile(options.outputRoot, segments);
      }

      if (claimedOutputs.get(outputFile) && claimedOutputs.get(outputFile) !== fingerprint) {
        const disambiguated = [...segments];
        disambiguated.splice(Math.max(disambiguated.length - 1, 1), 0, shortHash(fingerprint));
        segments = disambiguated;
        outputFile = toOutputFile(options.outputRoot, segments);
      }

      claimedOutputs.set(outputFile, fingerprint);
      const commandId = segments.join(' ');
      const usedFlagNames = new Set<string>();
      const parameters = (operation.parameters ?? []).filter(isSupportedParameter).map((parameter) => toGeneratedParameter(parameter, usedFlagNames));
      const bodyParameters = extractBodyParameters(operation.requestBody, usedFlagNames);
      const allParameters = [...parameters, ...bodyParameters];
      const hasBody = Boolean(operation.requestBody && !('$ref' in operation.requestBody));
      const moduleDisplayName = moduleConfig?.name ?? packageMetadata.displayName ?? source.moduleName;
      const moduleDescription = moduleConfig?.description ?? packageMetadata.description;
      const resourceDisplayName = resourceConfig?.name ?? resourceKey;
      const resourceDescription = resourceConfig?.description;
      const operationText = resolveOperationText({
        summary: operation.summary,
        description: operationOverride?.description ?? operation.description,
      });
      const summary = operationText.summary ?? `${method.toUpperCase()} ${pathTemplate}`;
      const generatedOperation: GeneratedOperation = {
        moduleName: logicalModuleName,
        moduleDisplayName,
        moduleDescription,
        resourceName: resourceKey,
        logicalResourceName: toLogicalResourceName(pathTemplate),
        actionName: toLogicalActionName(pathTemplate),
        resourceDisplayName,
        resourceDescription,
        commandId,
        method,
        pathTemplate,
        tags: operation.tags,
        summary,
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
          parameters: allParameters,
          requestBodySchema: getJsonRequestSchema(operation.requestBody),
        }),
        examples: buildExamples(commandId, {
          parameters: allParameters,
          hasBody,
        }),
        parameters: allParameters,
        hasBody,
        bodyRequired:
          operation.requestBody && !('$ref' in operation.requestBody) ? operation.requestBody.required : undefined,
      };

      await ensureDir(outputFile);
      await fs.writeFile(outputFile, renderCommandSource(generatedOperation, outputFile));
      outputs.push(outputFile);
      nextOutputs.add(outputFile);
    }

    nextManifest.files[source.sourceId] = {
      hash,
      outputs: outputs.map(toRelativePath),
    };
  }

  const staleOutputs = new Set<string>();
  for (const entry of Object.values(previousManifest.files)) {
    for (const output of entry.outputs) {
      const absoluteOutput = toAbsolutePath(output);
      if (!nextOutputs.has(absoluteOutput)) {
        staleOutputs.add(absoluteOutput);
      }
    }
  }

  for (const filePath of staleOutputs) {
    await fs.rm(filePath, {force: true});
  }

  await fs.mkdir(path.dirname(options.manifestFile), {recursive: true});
  await fs.writeFile(options.manifestFile, JSON.stringify(nextManifest, null, 2));
  await syncCommandRegistry(options.commandRegistryFile, [options.manualCommandsRoot, options.outputRoot]);

  return {
    sources: sources.length,
    commands: [...nextOutputs].length,
    removed: staleOutputs.size,
  };
}
