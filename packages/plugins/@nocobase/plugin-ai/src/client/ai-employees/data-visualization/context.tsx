/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { WorkContextOptions } from '../types';

export const chartConfigWorkContext: WorkContextOptions = {
  name: 'chart-config',
  tag: {
    Component: ({ item }) => (
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>📊 {item.title || 'Chart config'}</span>
    ),
  },
  getContent: async (app, item) => {
    const model = app.flowEngine.getModel(item.uid, true);
    const values = model?.getStepParams?.('chartSettings', 'configure') || {};
    const payload = {
      uid: item.uid,
      query: {
        mode: values?.query?.mode,
        sql: values?.query?.sql,
        sqlDatasource: values?.query?.sqlDatasource,
      },
      chart: {
        option: {
          mode: values?.chart?.option?.mode,
          raw: values?.chart?.option?.raw,
        },
        events: {
          mode: values?.chart?.events?.mode,
          raw: values?.chart?.events?.raw,
        },
      },
    };
    return JSON.stringify(payload, null, 2);
  },
};
