/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';

export const chartGenerator: ToolOptions = {
  name: 'chartGenerator',
  title: '{{t("Chart generator")}}',
  description: '{{t("Generates ECharts options (JSON) based on user input or data context.")}}',
  schema: z.object({
    options: z.record(z.any()).describe('Echarts options (JSON)'),
  }),
  invoke: async () => {
    return {
      status: 'success',
      content: 'Ok',
    };
  },
};
