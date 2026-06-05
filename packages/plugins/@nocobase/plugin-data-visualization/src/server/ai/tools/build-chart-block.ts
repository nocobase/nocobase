/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolOptions } from '@nocobase/plugin-ai';

export const buildChartBlock: ToolOptions = {
  name: 'buildChartBlock',
  title: '{{t("Build chart blocks")}}',
  description: '{{t("Helper to build chart blocks")}}',
  execution: 'frontend',
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      sql: {
        type: 'string',
      },
      echartsOption: {
        type: 'object',
        additionalProperties: true,
      },
    },
    required: ['sql', 'echartsOption'],
    additionalProperties: false,
  },
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have built the chart block successfully.',
    };
  },
};
