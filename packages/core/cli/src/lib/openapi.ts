import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type {OpenAPIV3} from 'openapi-types';
import ts from 'typescript';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type OpenApiSchema = OpenAPIV3.SchemaObject;
export type OpenApiParameter = OpenAPIV3.ParameterObject;
export type OpenApiRequestBody = OpenAPIV3.RequestBodyObject;
export type OpenApiOperation = OpenAPIV3.OperationObject;
export type OpenApiPathItem = OpenAPIV3.PathItemObject;
export type OpenApiDocument = OpenAPIV3.Document;

export interface SwaggerSource {
  moduleName: string;
  sourceFile: string;
  sourceId: string;
  packageFile?: string;
  packageName?: string;
  format: 'json' | 'ts';
}

const SWAGGER_FILENAMES = new Set(['index.json', 'index.ts', 'swagger.json']);
const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

function isPluginSwaggerSource(filePath: string) {
  return (
    filePath.includes(`${path.sep}packages${path.sep}plugins${path.sep}`) &&
    filePath.includes(`${path.sep}src${path.sep}swagger${path.sep}`)
  );
}

function isCoreSwaggerSource(filePath: string) {
  return filePath.includes(`${path.sep}packages${path.sep}core${path.sep}server${path.sep}src${path.sep}swagger${path.sep}`);
}

function toModuleName(filePath: string) {
  if (isCoreSwaggerSource(filePath)) {
    return 'core';
  }

  const normalized = filePath.replace(/\\/g, '/');
  const pluginMatch = normalized.match(/packages\/plugins\/@nocobase\/plugin-([^/]+)\//);
  return pluginMatch?.[1] ?? '';
}

function toPackageFile(filePath: string) {
  if (isCoreSwaggerSource(filePath)) {
    return '';
  }

  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/^(.*\/packages\/plugins\/@nocobase\/plugin-[^/]+)\//);
  return match ? `${match[1]}/package.json` : '';
}

function toPackageName(filePath: string) {
  if (isCoreSwaggerSource(filePath)) {
    return '@nocobase/server';
  }

  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/packages\/plugins\/(@nocobase\/plugin-[^/]+)\//);
  return match?.[1] ?? '';
}

async function walk(dir: string, result: string[]) {
  const entries = await fs.readdir(dir, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, result);
      continue;
    }

    if (!SWAGGER_FILENAMES.has(entry.name)) {
      continue;
    }

    if (!isPluginSwaggerSource(fullPath) && !isCoreSwaggerSource(fullPath)) {
      continue;
    }

    result.push(fullPath);
  }
}

export async function discoverSwaggerSources(sourceRoot: string) {
  const files: string[] = [];
  await walk(path.join(sourceRoot, 'packages'), files);

  return files
    .sort()
    .map((sourceFile): SwaggerSource => ({
      moduleName: toModuleName(sourceFile),
      sourceFile,
      sourceId: path.relative(sourceRoot, sourceFile).replace(/\\/g, '/'),
      packageFile: toPackageFile(sourceFile) || undefined,
      packageName: toPackageName(sourceFile) || undefined,
      format: sourceFile.endsWith('.json') ? 'json' : 'ts',
    }))
    .filter((item) => item.moduleName);
}

function getPropertyName(name: ts.PropertyName): string {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
    return name.expression.text;
  }

  throw new Error('Unsupported computed property in swagger object.');
}

function evaluateExpression(node: ts.Expression): any {
  if (ts.isObjectLiteralExpression(node)) {
    const value: Record<string, any> = {};

    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        value[getPropertyName(property.name)] = evaluateExpression(property.initializer);
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        throw new Error(`Unsupported shorthand property "${property.name.text}" in swagger object.`);
      }

      if (ts.isSpreadAssignment(property)) {
        throw new Error('Unsupported spread assignment in swagger object.');
      }

      if (ts.isMethodDeclaration(property) || ts.isAccessor(property)) {
        throw new Error('Unsupported method/accessor in swagger object.');
      }
    }

    return value;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) {
        throw new Error('Unsupported spread element in swagger array.');
      }

      return evaluateExpression(element);
    });
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isParenthesizedExpression(node)) {
    return evaluateExpression(node.expression);
  }

  if (ts.isPropertyAccessExpression(node)) {
    return {
      __target__: evaluateExpression(node.expression),
      __property__: node.name.text,
    };
  }

  if (ts.isCallExpression(node)) {
    const callee = evaluateExpression(node.expression);
    const args = node.arguments.map((argument) => evaluateExpression(argument));

    if (
      callee &&
      typeof callee === 'object' &&
      '__target__' in callee &&
      '__property__' in callee &&
      callee.__property__ === 'join' &&
      Array.isArray(callee.__target__)
    ) {
      return callee.__target__.join(args[0] ?? ',');
    }

    throw new Error('Unsupported call expression in swagger object.');
  }

  if (ts.isPrefixUnaryExpression(node)) {
    const operand = evaluateExpression(node.operand);
    if (node.operator === ts.SyntaxKind.MinusToken) {
      return -operand;
    }
    if (node.operator === ts.SyntaxKind.PlusToken) {
      return +operand;
    }
    if (node.operator === ts.SyntaxKind.ExclamationToken) {
      return !operand;
    }
  }

  throw new Error(`Unsupported swagger expression kind: ${ts.SyntaxKind[node.kind]}`);
}

function parseTypeScriptSwagger(sourceText: string, fileName: string): OpenApiDocument {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement)) {
      continue;
    }

    if (!ts.isObjectLiteralExpression(statement.expression)) {
      throw new Error('Expected `export default` to be an object literal.');
    }

    return evaluateExpression(statement.expression) as OpenApiDocument;
  }

  throw new Error('Missing `export default` in swagger source.');
}

function normalizeDocument(document: OpenApiDocument): OpenApiDocument {
  return {
    ...document,
    openapi: document.openapi ?? '3.0.2',
    info: {
      ...(document.info ?? {}),
      title: document.info?.title ?? 'NocoBase API',
      version: document.info?.version ?? '1.0.0',
    },
    paths: document.paths ?? {},
    components: document.components ?? {},
  };
}

export async function loadSwaggerDocument(source: SwaggerSource): Promise<OpenApiDocument> {
  const content = await fs.readFile(source.sourceFile, 'utf8');
  const document = normalizeDocument(
    source.format === 'json'
      ? (JSON.parse(content) as OpenApiDocument)
      : parseTypeScriptSwagger(content, source.sourceFile),
  );

  try {
    await SwaggerParser.validate(document as any);
    return (await SwaggerParser.dereference(document as any)) as OpenApiDocument;
  } catch (error) {
    return document;
  }
}

function resolveLocalRef(document: OpenApiDocument, ref: string) {
  if (!ref.startsWith('#/')) {
    return undefined;
  }

  return ref
    .slice(2)
    .split('/')
    .reduce<any>((current, segment) => current?.[segment], document);
}

function dereferenceNode<T>(node: T, document: OpenApiDocument, seen = new Set<string>()): T {
  if (Array.isArray(node)) {
    return node.map((item) => dereferenceNode(item, document, seen)) as unknown as T;
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const ref = (node as {$ref?: string}).$ref;
  if (typeof ref === 'string') {
    if (seen.has(ref)) {
      return {} as T;
    }

    const resolved = resolveLocalRef(document, ref);
    if (!resolved) {
      return node;
    }

    return dereferenceNode(resolved as T, document, new Set([...seen, ref]));
  }

  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, dereferenceNode(value, document, seen)]),
  ) as T;
}

export async function sha1File(filePath: string) {
  const content = await fs.readFile(filePath);
  return createHash('sha1').update(content).digest('hex');
}

export function collectOperations(document: OpenApiDocument) {
  const operations: Array<{method: HttpMethod; pathTemplate: string; operation: OpenApiOperation}> = [];

  for (const [pathTemplate, pathItem] of Object.entries(document.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem?.[method];
      if (!operation || '$ref' in operation) {
        continue;
      }

      const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]
        .map((parameter) => dereferenceNode(parameter, document))
        .filter((parameter): parameter is OpenApiParameter => Boolean(parameter && !('$ref' in parameter)));

      operations.push({
        method,
        pathTemplate,
        operation: {
          ...operation,
          parameters,
          requestBody: operation.requestBody ? dereferenceNode(operation.requestBody, document) : undefined,
        },
      });
    }
  }

  return operations;
}
