/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import swaggerDocument from '../../swagger';

type Schema = {
  type?: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  $ref?: string;
};

type Operation = {
  parameters?: Array<{ name?: string; in?: string }>;
  requestBody?: {
    content?: Record<string, { schema?: Schema }>;
  };
};

type SwaggerDocument = {
  paths: Record<string, Record<string, Operation>>;
  components?: {
    schemas?: Record<string, Schema>;
  };
};

const document = swaggerDocument as unknown as SwaggerDocument;
const schemas = document.components?.schemas ?? {};

const resolveSchema = (schema?: Schema) => {
  if (!schema?.$ref) {
    return schema;
  }
  return schemas[schema.$ref.split('/').pop() ?? ''];
};

const getOperation = (path: string, method: string) => document.paths[path]?.[method];
const getRequestSchema = (path: string, method: string) =>
  resolveSchema(getOperation(path, method)?.requestBody?.content?.['application/json']?.schema);

describe('AI plugin Swagger', () => {
  it('exports only the approved AI, LLM service, and AI employee actions with aligned methods', () => {
    const expectedMethods: Record<string, string> = {
      '/ai:listLLMProviders': 'get',
      '/ai:listProviderModels': 'post',
      '/ai:testFlight': 'post',
      '/ai:listModels': 'get',
      '/ai:listLLMServices': 'get',
      '/llmServices:list': 'get',
      '/llmServices:get': 'get',
      '/llmServices:create': 'post',
      '/llmServices:update': 'post',
      '/llmServices:destroy': 'post',
      '/aiEmployees:list': 'get',
      '/aiEmployees:get': 'get',
      '/aiEmployees:create': 'post',
      '/aiEmployees:update': 'post',
      '/aiEmployees:destroy': 'post',
    };

    expect(swaggerDocument.openapi).toBe('3.0.2');
    expect(Object.keys(document.paths).sort()).toEqual(Object.keys(expectedMethods).sort());

    for (const [path, method] of Object.entries(expectedMethods)) {
      expect(Object.keys(document.paths[path])).toEqual([method]);
    }

    expect(document.paths['/ai:listAllEnabledModels']).toBeUndefined();
    expect(document.paths['/llmServices:move']).toBeUndefined();
    expect(document.paths['/aiEmployees:move']).toBeUndefined();
    expect(document.paths['/aiEmployees:getTemplates']).toBeUndefined();
  });

  it('exposes fields projection on collection list actions', () => {
    for (const path of ['/llmServices:list', '/aiEmployees:list']) {
      expect(getOperation(path, 'get')?.parameters).toContainEqual(
        expect.objectContaining({ name: 'fields', in: 'query' }),
      );
    }
  });

  it('keeps custom action parameters aligned with their server action parameter sources', () => {
    expect(getRequestSchema('/ai:listProviderModels', 'post')).toBe(schemas.LLMProviderModelsRequest);
    expect(getRequestSchema('/ai:testFlight', 'post')).toBe(schemas.LLMTestFlightRequest);

    const listModelsParameters = getOperation('/ai:listModels', 'get')?.parameters ?? [];
    expect(listModelsParameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'llmService', in: 'query' }),
        expect.objectContaining({ name: 'model', in: 'query' }),
      ]),
    );

    expect(getOperation('/llmServices:update', 'post')?.parameters).toContainEqual(
      expect.objectContaining({ name: 'filterByTk', in: 'query' }),
    );
    expect(getOperation('/aiEmployees:update', 'post')?.parameters).toContainEqual(
      expect.objectContaining({ name: 'filterByTk', in: 'query' }),
    );
  });

  it('restricts LLM service write schemas to supported fields and enabled model modes', () => {
    const create = schemas.LLMServiceCreate;
    const patch = schemas.LLMServicePatch;

    expect(create.additionalProperties).toBe(false);
    expect(patch.additionalProperties).toBe(false);
    expect(create.properties?.modelOptions).toBeUndefined();
    expect(patch.properties?.modelOptions).toBeUndefined();
    expect(create.properties?.enabledModels?.properties?.mode?.enum).toEqual(['provider', 'custom']);
    expect(patch.properties?.enabledModels?.properties?.mode?.enum).toEqual(['provider', 'custom']);
  });

  it('excludes server-managed AI employee fields from create and update schemas', () => {
    const create = schemas.AIEmployeeCreate;
    const patch = schemas.AIEmployeePatch;
    const forbiddenFields = [
      'builtIn',
      'category',
      'deprecated',
      'chatSettings',
      'dataSourceSettings',
      'skillSettings',
    ];

    expect(create.additionalProperties).toBe(false);
    expect(patch.additionalProperties).toBe(false);

    for (const field of forbiddenFields) {
      expect(create.properties?.[field]).toBeUndefined();
      expect(patch.properties?.[field]).toBeUndefined();
    }

    expect(schemas.AIEmployee.properties?.builtIn).toMatchObject({ type: 'boolean' });
    expect(schemas.AIEmployee.properties?.category).toMatchObject({ type: 'string' });
    expect(schemas.AIEmployee.properties?.deprecated).toMatchObject({ type: 'boolean' });
  });
});
