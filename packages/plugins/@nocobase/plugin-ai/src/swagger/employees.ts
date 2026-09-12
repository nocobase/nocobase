/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { filterByTkParameter, jsonContent, listParameters, okResponse, withErrorResponses } from './common';

export const employeePaths = {
  '/aiEmployees:list': {
    get: {
      operationId: 'aiEmployees:list',
      tags: ['aiEmployees'],
      summary: 'List AI employees',
      parameters: listParameters,
      responses: withErrorResponses(
        okResponse({
          oneOf: [
            {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AIEmployee',
              },
            },
            {
              type: 'object',
              properties: {
                rows: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/AIEmployee',
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
  '/aiEmployees:get': {
    get: {
      operationId: 'aiEmployees:get',
      tags: ['aiEmployees'],
      summary: 'Get one AI employee',
      parameters: [filterByTkParameter],
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/AIEmployee',
        }),
      ),
    },
  },
  '/aiEmployees:create': {
    post: {
      operationId: 'aiEmployees:create',
      tags: ['aiEmployees'],
      summary: 'Create an AI employee',
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/AIEmployeeCreate',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/AIEmployee',
        }),
      ),
    },
  },
  '/aiEmployees:update': {
    post: {
      operationId: 'aiEmployees:update',
      tags: ['aiEmployees'],
      summary: 'Update an AI employee',
      parameters: [filterByTkParameter],
      requestBody: {
        required: true,
        content: jsonContent({
          $ref: '#/components/schemas/AIEmployeePatch',
        }),
      },
      responses: withErrorResponses(
        okResponse({
          $ref: '#/components/schemas/AIEmployee',
        }),
      ),
    },
  },
  '/aiEmployees:destroy': {
    post: {
      operationId: 'aiEmployees:destroy',
      tags: ['aiEmployees'],
      summary: 'Delete an AI employee',
      parameters: [filterByTkParameter],
      responses: withErrorResponses(okResponse()),
    },
  },
};
