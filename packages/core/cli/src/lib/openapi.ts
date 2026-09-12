/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { OpenAPIV3 } from 'openapi-types';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type OpenApiSchema = OpenAPIV3.SchemaObject;
export type OpenApiParameter = OpenAPIV3.ParameterObject;
export type OpenApiRequestBody = OpenAPIV3.RequestBodyObject;
export type OpenApiOperation = OpenAPIV3.OperationObject;
export type OpenApiPathItem = OpenAPIV3.PathItemObject;
export type OpenApiDocument = OpenAPIV3.Document;

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete'];

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

  const ref = (node as { $ref?: string }).$ref;
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

export function collectOperations(document: OpenApiDocument) {
  const operations: Array<{ method: HttpMethod; pathTemplate: string; operation: OpenApiOperation }> = [];

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
