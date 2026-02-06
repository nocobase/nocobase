/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("Chart generator")}}',
    about: '{{t("Generates ECharts options (JSON) based on user input or data context.")}}',
  },
  definition: {
    name: 'chartGenerator',
    description: 'Generates ECharts options (JSON) based on user input or data context.',
    schema: z.object({
      options: z
        .object({})
        .catchall(z.any())
        .describe(
          `Valid ECharts options object.
        Example: {
          "title": { "text": "Sales Trend" },
          "tooltip": {},
          "xAxis": { "type": "category", "data": ["Jan", "Feb", "Mar"] },
          "yAxis": { "type": "value" },
          "series": [{ "type": "line", "data": [120, 200, 150] }]
        }`,
        ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
      content: 'Ok',
    };
  },
});
