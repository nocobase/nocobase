/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest, FlowSchemaManifestContribution } from '@nocobase/flow-engine';

const iframeParamSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const iframeBlockModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'IframeBlockModel',
  title: 'Iframe block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      iframeBlockSettings: {
        type: 'object',
        properties: {
          editIframe: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['url', 'html'],
              },
              url: { type: 'string' },
              allow: {
                type: 'string',
                enum: [
                  'autoplay',
                  'camera',
                  'document-domain',
                  'encrypted-media',
                  'fullscreen',
                  'geolocation',
                  'microphone',
                  'midi',
                  'payment',
                ],
              },
              params: {
                type: 'array',
                items: iframeParamSchema as any,
              },
              html: { type: 'string' },
              htmlId: { type: ['string', 'number', 'null'] as any },
              height: { type: ['number', 'string', 'null'] as any },
            },
            required: ['mode'],
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-iframe-block-uid',
    use: 'IframeBlockModel',
    stepParams: {
      iframeBlockSettings: {
        editIframe: {
          mode: 'url',
          url: 'https://www.nocobase.com',
          params: [],
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'iframe-homepage',
      use: 'IframeBlockModel',
      stepParams: {
        iframeBlockSettings: {
          editIframe: {
            mode: 'url',
            url: 'https://www.nocobase.com',
            params: [],
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'IframeBlockModel.stepParams.iframeBlockSettings.editIframe.htmlId',
        message: 'HTML mode persists raw HTML to the iframeHtml resource and stores the returned htmlId.',
        'x-flow': {
          contextRequirements: ['iframeHtml resource'],
          unresolvedReason: 'runtime-iframe-html-storage',
          recommendedFallback: null,
        },
      },
    ],
  },
};

export const flowSchemaManifestContribution: FlowSchemaManifestContribution = {
  inventory: {
    publicModels: ['IframeBlockModel'],
  },
  models: [iframeBlockModelSchemaManifest],
  defaults: {
    source: 'plugin',
  },
};
