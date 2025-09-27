/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { ToolOptions, ToolCall } from '@nocobase/plugin-ai/client';

const ChartBlock: React.FC<{
  messageId: string;
  tool: ToolCall<{
    sql: string;
    echartsOption: Record<string, any>;
  }>;
}> = ({ tool }) => {
  const flowEngine = useFlowEngine();
  const model = flowEngine.createModel({
    uid: 'test',
    use: 'ChartBlockModel',
    stepParams: {
      chartSettings: {
        configure: {
          query: {
            sql: tool.args.sql,
          },
          chart: {
            option: {
              raw: JSON.stringify(tool.args.echartsOption, null, 2),
            },
          },
        },
      },
    },
  });

  return <FlowModelRenderer model={model} showFlowSettings />;
};
export const buildChartBlockTool: [string, string, ToolOptions] = [
  'frontend',
  'buildChartBlock',
  {
    ui: {
      card: ChartBlock,
    },
  },
];
