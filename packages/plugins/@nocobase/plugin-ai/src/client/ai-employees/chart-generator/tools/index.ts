/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolsOptions, lazy } from '@nocobase/client';

const { Echarts } = lazy(() => import('../ui/ECharts'), 'Echarts');

export const chartGeneratorTool: [string, ToolsOptions] = [
  'chartGenerator',
  {
    ui: {
      card: Echarts,
    },
  },
];
