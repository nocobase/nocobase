/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY, ToolsOptions } from '@nocobase/client';

type VizModel = {
  getStepParams?: (flowKey: string, stepKey: string) => any;
  setStepParams?: (flowKey: string, stepKey: string, params: any) => void;
  onPreview?: (params: { query: any; chart: any }, needQueryData?: boolean) => Promise<void>;
  resource?: {
    getData?: () => any;
  };
};

export const vizSwitchModesTool: [string, ToolsOptions] = [
  'switchModes',
  {
    invoke: async (app, params: { uid: string }) => {
      const model = app.flowEngine.getModel(params?.uid, true) as VizModel | undefined;
      if (!model) return { success: false, error: 'Model not found' };
      const current = model.getStepParams?.('chartSettings', 'configure') || {};
      const next = {
        ...current,
        query: {
          ...(current?.query || {}),
          mode: 'sql',
          sqlDatasource: current?.query?.sqlDatasource ?? DEFAULT_DATA_SOURCE_KEY,
        },
        chart: {
          ...(current?.chart || {}),
          option: {
            ...(current?.chart?.option || {}),
            mode: 'custom',
            raw: current?.chart?.option?.raw,
          },
          events: {
            ...(current?.chart?.events || {}),
            mode: 'custom',
            raw: current?.chart?.events?.raw,
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
    invoke: async (app, params: { uid: string; limit?: number }) => {
      const model = app.flowEngine.getModel(params?.uid, true) as VizModel | undefined;
      if (!model) return { success: false, error: 'Model not found' };
      const values = model.getStepParams?.('chartSettings', 'configure') || {};
      await model.onPreview?.(values, true);
      const data = model.resource?.getData?.() || [];
      const sample = (Array.isArray(data) ? data : []).slice(0, Math.max(params?.limit || 10, 1));
      const columns = Object.keys(sample?.[0] || {});
      return { success: true, columns, sample };
    },
  },
];
