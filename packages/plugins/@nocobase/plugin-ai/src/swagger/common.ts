/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const jsonContent = (schema: Record<string, unknown>) => ({
  'application/json': {
    schema,
  },
});

export const okResponse = (schema?: Record<string, unknown>) => ({
  200: {
    description: 'OK',
    ...(schema ? { content: jsonContent(schema) } : {}),
  },
});

export const errorResponses = {
  400: {
    description: 'Bad request',
    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
  },
  401: {
    description: 'Unauthorized',
    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
  },
  403: {
    description: 'Forbidden',
    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
  },
  404: {
    description: 'Not found',
    content: jsonContent({ $ref: '#/components/schemas/ErrorResponse' }),
  },
};

export const withErrorResponses = (responses: Record<string | number, unknown>) => ({
  ...responses,
  ...errorResponses,
});

export const filterByTkParameter = {
  name: 'filterByTk',
  in: 'query',
  required: true,
  description: 'Primary key of the target record.',
  schema: {
    type: 'string',
  },
};

export const listParameters = [
  {
    name: 'filter',
    in: 'query',
    description: 'NocoBase filter object encoded as JSON.',
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  },
  {
    name: 'fields',
    in: 'query',
    description: 'Fields to include in the response.',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  {
    name: 'sort',
    in: 'query',
    description: 'Sort fields. Prefix a field with - for descending order.',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  {
    name: 'page',
    in: 'query',
    schema: {
      type: 'integer',
      minimum: 1,
    },
  },
  {
    name: 'pageSize',
    in: 'query',
    schema: {
      type: 'integer',
      minimum: 1,
    },
  },
  {
    name: 'paginate',
    in: 'query',
    description: 'Set to false to return an unpaginated array.',
    schema: {
      type: 'boolean',
    },
  },
];
