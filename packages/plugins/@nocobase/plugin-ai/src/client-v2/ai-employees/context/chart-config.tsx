/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BarChartOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import type { WorkContextOptions } from '../types';

type ChartModelLike = {
  getStepParams?: (modelKey: string, stepKey: string) => Record<string, unknown> | undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const readRecord = (value: unknown, key: string) => {
  if (!isRecord(value)) {
    return undefined;
  }
  return value[key];
};

export const chartConfigWorkContext: WorkContextOptions = {
  name: 'chart-config',
  tag: {
    Component: ({ item }) => (
      <Space>
        <BarChartOutlined />
        <span>{item.title || 'Chart config'}</span>
      </Space>
    ),
  },
  getContent: async (app, item) => {
    if (item.content) {
      return item.content;
    }
    const model = app.flowEngine.getModel(item.uid, true) as ChartModelLike | undefined;
    const values = model?.getStepParams?.('chartSettings', 'configure') || {};
    const query = readRecord(values, 'query');
    const chart = readRecord(values, 'chart');
    const option = readRecord(chart, 'option');
    const events = readRecord(chart, 'events');
    return {
      uid: item.uid,
      query: {
        mode: readRecord(query, 'mode'),
        sql: readRecord(query, 'sql'),
        sqlDatasource: readRecord(query, 'sqlDatasource'),
      },
      chart: {
        option: {
          mode: readRecord(option, 'mode'),
          raw: readRecord(option, 'raw'),
        },
        events: {
          mode: readRecord(events, 'mode'),
          raw: readRecord(events, 'raw'),
        },
      },
    };
  },
};
