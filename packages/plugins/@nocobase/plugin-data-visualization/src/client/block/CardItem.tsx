/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { CardItem, NocoBaseRecursionField, useMobileLayout, useToken, withDynamicSchemaProps } from '@nocobase/client';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';
import React, { useMemo } from 'react';

export const ChartCardItem = withDynamicSchemaProps(
  (props) => {
    const { token } = useToken();
    const filedSchema = useFieldSchema();
    const { isMobileLayout } = useMobileLayout();
    const schema = useMemo(
      () => (isMobileLayout ? transformMultiColumnToSingleColumn(filedSchema, isAntdStatistic) : filedSchema),
      [isMobileLayout, filedSchema],
    );
    return (
      <CardItem
        className="nb-chart-block"
        name="charts"
        bodyStyle={{
          padding: `${token.paddingLG}px ${token.paddingLG}px 0`,
        }}
        {...props}
      >
        <NocoBaseRecursionField schema={schema} onlyRenderProperties />
      </CardItem>
    );
  },
  {
    displayName: 'ChartCardItem',
  },
);

function isAntdStatistic(columnSchema: any) {
  const chartBlock = Object.values(columnSchema.properties || {})[0];

  if (
    chartBlock?.['x-decorator'] === 'ChartRendererProvider' &&
    chartBlock?.['x-decorator-props']?.config?.chartType === 'antd.statistic'
  ) {
    return true;
  }

  return false;
}
