/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { transformFilter } from '@nocobase/utils/client';
import type { WorkContextOptions } from '../types';

type DatasourceResponse = {
  datasource?: string;
  collectionName?: string;
  fields?: unknown;
  filter?: unknown;
  sort?: unknown;
  limit?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const DatasourceContext: WorkContextOptions = {
  name: 'datasource',
  tag: {
    Component: ({ item }) => (
      <Space>
        <DatabaseOutlined />
        <span>{item?.title || ''}</span>
      </Space>
    ),
  },
  getContent: async (app, { uid, content }) => {
    if (content) {
      return content;
    }
    const response = await app.apiClient.resource('aiContextDatasources').get({ filterByTk: uid });
    const data = response.data?.data as unknown;
    if (!isRecord(data)) {
      return {};
    }
    const datasource = data as DatasourceResponse;
    return {
      datasource: datasource.datasource,
      collectionName: datasource.collectionName,
      fields: datasource.fields,
      filter: transformFilter(datasource.filter),
      sort: datasource.sort,
      limit: datasource.limit,
    };
  },
};
