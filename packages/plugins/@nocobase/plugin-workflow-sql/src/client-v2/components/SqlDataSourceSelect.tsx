/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useRequest } from 'ahooks';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';

type DataSourceLike = {
  key: string;
  displayName?: string;
  options?: {
    isDBInstance?: boolean;
  };
};

export function SqlDataSourceSelect(props: SelectProps<string>) {
  const ctx = useFlowContext();
  const { loading } = useRequest(() => ctx.dataSourceManager?.ensureLoaded?.({ keys: ['*'] }) ?? Promise.resolve(), {
    ready: Boolean(ctx.dataSourceManager),
  });

  const dataSources = (ctx.dataSourceManager?.getDataSources?.() ?? []) as DataSourceLike[];
  const options = dataSources
    .filter((item) => item.options?.isDBInstance || item.key === DEFAULT_DATA_SOURCE_KEY)
    .map((item) => ({
      label: item.displayName || item.key,
      value: item.key,
    }));

  return <Select {...props} loading={loading || props.loading} options={options} />;
}
