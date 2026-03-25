/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution, FlowSchemaContribution } from '@nocobase/flow-engine';

const markdownBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'MarkdownBlockModel',
  title: 'Markdown block',
  source: 'plugin',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      markdownBlockSettings: {
        type: 'object',
        properties: {
          editMarkdown: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
              },
            },
            required: ['content'],
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-markdown-block-uid',
    use: 'MarkdownBlockModel',
    stepParams: {
      markdownBlockSettings: {
        editMarkdown: {
          content: 'This is a demo text, **supports Markdown syntax**.',
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'markdown-intro',
      use: 'MarkdownBlockModel',
      stepParams: {
        markdownBlockSettings: {
          editMarkdown: {
            content: '# Welcome',
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'MarkdownBlockModel.stepParams.markdownBlockSettings.editMarkdown.content',
        message: 'Markdown content can contain liquid variables resolved against the runtime flow context.',
        'x-flow': {
          contextRequirements: ['liquid variables', 'markdown renderer'],
          unresolvedReason: 'runtime-markdown-context',
          recommendedFallback: '# Welcome',
        },
      },
    ],
  },
};

export const flowSchemaContribution: FlowSchemaContribution = {
  inventory: {
    publicTreeRoots: ['MarkdownBlockModel'],
  },
  models: [markdownBlockModelSchemaContribution],
  defaults: {
    source: 'plugin',
  },
};
