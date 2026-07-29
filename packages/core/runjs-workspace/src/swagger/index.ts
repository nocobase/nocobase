/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { runJSAuthoringContractV1 } from '../shared/authoring-contract';

const inlineWorkspace = runJSAuthoringContractV1.inlineWorkspace;
const externalization = runJSAuthoringContractV1.externalization;

export const runJSAuthoringCapabilitySchema = {
  type: 'object',
  required: ['authoringContractVersion', 'inlineWorkspace', 'externalization'],
  properties: {
    authoringContractVersion: {
      type: 'string',
      enum: [runJSAuthoringContractV1.authoringContractVersion],
    },
    inlineWorkspace: {
      type: 'object',
      required: ['available', 'saveMode', 'supportsMaterialize', 'ownerKinds', 'modelUses'],
      properties: {
        available: { type: 'boolean' },
        saveMode: { type: 'string', enum: [inlineWorkspace.saveMode] },
        supportsMaterialize: { type: 'boolean' },
        ownerKinds: {
          type: 'array',
          items: { type: 'string', enum: [...inlineWorkspace.ownerKinds] },
        },
        modelUses: {
          type: 'array',
          items: { type: 'string', enum: [...inlineWorkspace.modelUses] },
        },
      },
    },
    externalization: {
      type: 'object',
      required: ['available', 'entryKinds', 'destinationTypes', 'supportsIdempotency', 'supportsMoveToInline'],
      properties: {
        available: { type: 'boolean' },
        entryKinds: {
          type: 'array',
          items: { type: 'string', enum: [...externalization.entryKinds] },
        },
        destinationTypes: {
          type: 'array',
          items: { type: 'string', enum: [...externalization.destinationTypes] },
        },
        supportsIdempotency: { type: 'boolean' },
        supportsMoveToInline: { type: 'boolean' },
      },
    },
  },
};

export default {
  openapi: '3.0.2',
  info: {
    title: 'NocoBase API - RunJS workspace',
    version: '1.0.0',
  },
  tags: [
    {
      name: 'runJSSources',
      description: 'Discover and author owner-aware RunJS workspaces.',
    },
  ],
  paths: {
    '/runJSSources:capabilities': {
      post: {
        tags: ['runJSSources'],
        summary: 'Get the versioned RunJS authoring contract',
        description:
          'Returns the stable Inline Workspace owner matrix and the currently available externalization capability.',
        responses: {
          200: {
            description: 'The machine-readable RunJS authoring capabilities.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RunJSAuthoringCapabilities' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      RunJSAuthoringCapabilities: runJSAuthoringCapabilitySchema,
    },
  },
};
