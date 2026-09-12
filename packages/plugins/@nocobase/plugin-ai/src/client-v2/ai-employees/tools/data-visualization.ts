/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY, type ToolsOptions } from '@nocobase/client-v2';

type ChartSettings = {
  query?: {
    mode?: string;
    sqlDatasource?: string;
    [key: string]: unknown;
  };
  chart?: {
    option?: {
      mode?: string;
      raw?: unknown;
      [key: string]: unknown;
    };
    events?: {
      mode?: string;
      raw?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type VizModel = {
  getStepParams?: (flowKey: string, stepKey: string) => ChartSettings | undefined;
  setStepParams?: (flowKey: string, stepKey: string, params: ChartSettings) => void;
  onPreview?: (params: ChartSettings, needQueryData?: boolean) => Promise<void>;
  resource?: {
    getData?: () => unknown;
  };
};

export const vizSwitchModesTool: [string, ToolsOptions] = [
  'switchModes',
  {
    invoke: async (app, params: { uid?: string }) => {
      const model = params?.uid ? (app.flowEngine.getModel(params.uid, true) as VizModel | undefined) : undefined;
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const current = model.getStepParams?.('chartSettings', 'configure') || {};
      const next: ChartSettings = {
        ...current,
        query: {
          ...(current.query || {}),
          mode: 'sql',
          sqlDatasource: current.query?.sqlDatasource ?? DEFAULT_DATA_SOURCE_KEY,
        },
        chart: {
          ...(current.chart || {}),
          option: {
            ...(current.chart?.option || {}),
            mode: 'custom',
            raw: current.chart?.option?.raw,
          },
          events: {
            ...(current.chart?.events || {}),
            mode: 'custom',
            raw: current.chart?.events?.raw,
          },
        },
      };
      model.setStepParams?.('chartSettings', 'configure', next);
      await model.onPreview?.(next);
      return { success: true };
    },
  },
];

export const vizRunQueryTool: [string, ToolsOptions] = [
  'runQuery',
  {
    invoke: async (app, params: { uid?: string; limit?: number }) => {
      const model = params?.uid ? (app.flowEngine.getModel(params.uid, true) as VizModel | undefined) : undefined;
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      const values = model.getStepParams?.('chartSettings', 'configure') || {};
      await model.onPreview?.(values, true);
      const data = model.resource?.getData?.() || [];
      const sample = (Array.isArray(data) ? data : []).slice(0, Math.max(params?.limit || 10, 1));
      const first = sample[0];
      const columns = first && typeof first === 'object' ? Object.keys(first) : [];
      return { success: true, columns, sample };
    },
  },
];
