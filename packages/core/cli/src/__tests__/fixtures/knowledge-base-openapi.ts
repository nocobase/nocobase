/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const filterByTkParameter = {
  name: 'filterByTk',
  in: 'query',
  required: true,
  schema: { type: 'string' },
};

const listParameters = [
  { name: 'filter', in: 'query', schema: { type: 'object', additionalProperties: true } },
  { name: 'fields', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
  { name: 'sort', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
  { name: 'page', in: 'query', schema: { type: 'integer' } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
  { name: 'paginate', in: 'query', schema: { type: 'boolean' } },
];

const jsonRequest = (properties: Record<string, unknown>, required: string[] = []) => ({
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      },
    },
  },
});

const collectionPaths = (
  resource: string,
  writeProperties: Record<string, unknown>,
  required: string[],
  destroyParameter = filterByTkParameter,
) => ({
  [`/${resource}:list`]: {
    get: { operationId: `${resource}:list`, tags: [resource], parameters: listParameters, responses: { 200: {} } },
  },
  [`/${resource}:get`]: {
    get: { operationId: `${resource}:get`, tags: [resource], parameters: [filterByTkParameter], responses: { 200: {} } },
  },
  [`/${resource}:create`]: {
    post: {
      operationId: `${resource}:create`,
      tags: [resource],
      requestBody: jsonRequest(writeProperties, required),
      responses: { 200: {} },
    },
  },
  [`/${resource}:update`]: {
    post: {
      operationId: `${resource}:update`,
      tags: [resource],
      parameters: [filterByTkParameter],
      requestBody: jsonRequest(writeProperties),
      responses: { 200: {} },
    },
  },
  [`/${resource}:destroy`]: {
    post: { operationId: `${resource}:destroy`, tags: [resource], parameters: [destroyParameter], responses: { 200: {} } },
  },
});

const connectProps = {
  type: 'object',
  properties: {
    host: { type: 'string' },
    port: { type: 'integer' },
    user: { type: 'string' },
    password: { type: 'string' },
    database: { type: 'string' },
    tableName: { type: 'string' },
  },
};

const vectorDatabaseWriteProperties = {
  key: { type: 'string' },
  name: { type: 'string' },
  databaseSpec: { type: 'string' },
  provider: { type: 'string' },
  connectProps,
  enabled: { type: 'boolean' },
  skipTableExistedCheck: { type: 'boolean' },
};

const knowledgeBaseWriteProperties = {
  knowledgeBaseType: { type: 'string' },
  key: { type: 'string' },
  name: { type: 'string' },
  description: { type: 'string' },
  enabled: { type: 'boolean' },
  storageId: { type: 'string' },
  vectorDatabaseKey: { type: 'string' },
  llmService: { type: 'string' },
  embeddingModel: { type: 'string' },
  segmentOptions: { type: 'object', additionalProperties: true },
  vectorStoreProvider: { type: 'string' },
  vectorStoreProps: { type: 'array', items: { type: 'object', additionalProperties: true } },
};

const multipleIdsParameter = {
  ...filterByTkParameter,
  schema: { type: 'array', items: { type: 'integer' } },
};

const knowledgeBaseSwaggerDocument = {
  openapi: '3.0.2',
  info: {
    title: 'Knowledge base runtime fixture',
    version: '1.0.0',
  },
  tags: [
    { name: 'aiVectorDatabases' },
    { name: 'aiKnowledgeBase' },
    { name: 'aiKnowledgeBaseDocs' },
  ],
  paths: {
    ...collectionPaths(
      'aiVectorDatabases',
      vectorDatabaseWriteProperties,
      ['key', 'name', 'databaseSpec', 'provider', 'connectProps', 'enabled'],
      multipleIdsParameter,
    ),
    '/aiVectorDatabases:listProviders': {
      get: {
        operationId: 'aiVectorDatabases:listProviders',
        tags: ['aiVectorDatabases'],
        responses: { 200: {} },
      },
    },
    '/aiVectorDatabases:testConnection': {
      post: {
        operationId: 'aiVectorDatabases:testConnection',
        tags: ['aiVectorDatabases'],
        requestBody: jsonRequest({ provider: { type: 'string' }, connectProps }, ['provider', 'connectProps']),
        responses: { 200: {} },
      },
    },
    ...collectionPaths(
      'aiKnowledgeBase',
      knowledgeBaseWriteProperties,
      ['knowledgeBaseType', 'key', 'name', 'enabled'],
      multipleIdsParameter,
    ),
    '/aiKnowledgeBase:runHitTest': {
      post: {
        operationId: 'aiKnowledgeBase:runHitTest',
        tags: ['aiKnowledgeBase'],
        requestBody: jsonRequest(
          {
            knowledgeBaseKey: { type: 'string' },
            query: { type: 'string' },
            topK: { type: 'integer' },
            score: { type: 'number' },
          },
          ['knowledgeBaseKey', 'query', 'topK', 'score'],
        ),
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBase:listExternalVectorStoreProviders': {
      get: {
        operationId: 'aiKnowledgeBase:listExternalVectorStoreProviders',
        tags: ['aiKnowledgeBase'],
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBaseDocs:list': {
      get: {
        operationId: 'aiKnowledgeBaseDocs:list',
        tags: ['aiKnowledgeBaseDocs'],
        parameters: listParameters,
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBaseDocs:get': {
      get: {
        operationId: 'aiKnowledgeBaseDocs:get',
        tags: ['aiKnowledgeBaseDocs'],
        parameters: [filterByTkParameter],
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBaseDocs:upload': {
      post: {
        operationId: 'aiKnowledgeBaseDocs:upload',
        tags: ['aiKnowledgeBaseDocs'],
        parameters: [{ name: 'knowledgeBaseKey', in: 'query', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  zipFilenameEncoding: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBaseDocs:vectorization': {
      post: {
        operationId: 'aiKnowledgeBaseDocs:vectorization',
        tags: ['aiKnowledgeBaseDocs'],
        parameters: [
          { name: 'knowledgeBaseKey', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'query', schema: { type: 'array', items: { type: 'integer' } } },
        ],
        responses: { 200: {} },
      },
    },
    '/aiKnowledgeBaseDocs:destroy': {
      post: {
        operationId: 'aiKnowledgeBaseDocs:destroy',
        tags: ['aiKnowledgeBaseDocs'],
        parameters: [multipleIdsParameter],
        responses: { 200: {} },
      },
    },
  },
  components: {
    schemas: {},
  },
};

export default knowledgeBaseSwaggerDocument;
