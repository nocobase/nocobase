/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { filterByTkParameter, jsonContent, listParameters, okResponse, withErrorResponses } from './common';

const modelTypeParameter = {
  name: 'model',
  in: 'query',
  description: 'Filter by supported model type.',
  schema: {
    type: 'string',
    enum: ['LLM', 'EMBEDDING'],
  },
};

export const llmPaths = {
  '/ai:listLLMProviders': {
    get: {
      operationId: 'ai:listLLMProviders',
      tags: ['ai'],
      summary: 'List registered LLM providers',
      responses: withErrorResponses(
        okResponse({
          type: 'array',
          items: {
            $ref: '#/components/schemas/LLMProvider',
          },
        }),
      ),
    },
  },
  '/ai:listProviderModels': {
    post: {
      operationId: 'ai:listProviderModels',
      tags: ['ai'],
      summary: 'List models available from an LLM provider',
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/LLMProviderModelsRequest',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          type: 'array',
          items: {
            $ref: '#/components/schemas/LLMModel',
          },
        }),
      ),
    },
  },
  '/ai:testFlight': {
    post: {
      operationId: 'ai:testFlight',
      tags: ['ai'],
      summary: 'Validate an LLM provider configuration',
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/LLMTestFlightRequest',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/LLMTestFlightResult',
        }),
      ),
    },
  },
  '/ai:listModels': {
    get: {
      operationId: 'ai:listModels',
      tags: ['ai'],
      summary: 'List models available for an LLM service',
      parameters: [
        {
          name: 'llmService',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
        },
        modelTypeParameter,
      ],
      responses: withErrorResponses(
        okResponse({
          type: 'array',
          items: {
            $ref: '#/components/schemas/LLMModel',
          },
        }),
      ),
    },
  },
  '/ai:listLLMServices': {
    get: {
      operationId: 'ai:listLLMServices',
      tags: ['ai'],
      summary: 'List enabled LLM services',
      parameters: [
        {
          name: 'filter',
          in: 'query',
          description: 'NocoBase filter object encoded as JSON.',
          schema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        modelTypeParameter,
      ],
      responses: withErrorResponses(
        okResponse({
          type: 'array',
          items: {
            $ref: '#/components/schemas/EnabledLLMService',
          },
        }),
      ),
    },
  },
  '/llmServices:list': {
    get: {
      operationId: 'llmServices:list',
      tags: ['llmServices'],
      summary: 'List saved LLM services',
      parameters: listParameters,
      responses: withErrorResponses(
        okResponse({
          oneOf: [
            {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LLMService',
              },
            },
            {
              type: 'object',
              properties: {
                rows: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/LLMService',
                  },
                },
                count: {
                  type: 'integer',
                },
              },
            },
          ],
        }),
      ),
    },
  },
  '/llmServices:get': {
    get: {
      operationId: 'llmServices:get',
      tags: ['llmServices'],
      summary: 'Get one saved LLM service',
      parameters: [filterByTkParameter],
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/LLMService',
        }),
      ),
    },
  },
  '/llmServices:create': {
    post: {
      operationId: 'llmServices:create',
      'x-nocobase-cli-ui': {
        path: 'admin/settings/ai/llm-services',
        parameters: ['provider'],
      },
      tags: ['llmServices'],
      summary: 'Create an LLM service',
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/LLMServiceCreate',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/LLMService',
        }),
      ),
    },
  },
  '/llmServices:update': {
    post: {
      operationId: 'llmServices:update',
      'x-nocobase-cli-ui': {
        path: 'admin/settings/ai/llm-services',
        parameters: ['filterByTk'],
      },
      tags: ['llmServices'],
      summary: 'Update an LLM service',
      parameters: [filterByTkParameter],
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/LLMServicePatch',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/LLMService',
        }),
      ),
    },
  },
  '/llmServices:destroy': {
    post: {
      operationId: 'llmServices:destroy',
      tags: ['llmServices'],
      summary: 'Delete an LLM service',
      parameters: [filterByTkParameter],
      responses: withErrorResponses(okResponse()),
    },
  },
};
