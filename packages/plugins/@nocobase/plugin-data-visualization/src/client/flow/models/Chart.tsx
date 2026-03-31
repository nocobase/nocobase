/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useEffect, useState } from 'react';
import ECharts from './ECharts';
import { Empty, Result, Typography, Spin } from 'antd';
import { EChartsOption, EChartsType } from 'echarts';
import { ErrorBoundary } from 'react-error-boundary';
import { useT } from '../../locale';
const { Paragraph, Text } = Typography;

export interface ChartOptions {
  option: EChartsOption;
  dataSource: any;
  onRefReady?: (chart: EChartsType) => void;
  loading?: boolean;
}

const ErrorFallback = ({ error }) => {
  const t = useT();

  return (
    <div style={{ backgroundColor: 'white' }}>
      <Result status="error" title={t('Render Failed')} subTitle={t('Please check the configuration.')}>
        <Paragraph copyable>
          <Text type="danger" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
            {error.message}
          </Text>
        </Paragraph>
      </Result>
    </div>
  );
};

export const Chart = forwardRef<EChartsType, ChartOptions>(({ option, dataSource, onRefReady, loading }, ref) => {
  const [errorKey, setErrorKey] = useState(0);
  const t = useT();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 400 }}>
        <Spin />
      </div>
    );
  }

  if (!option || !dataSource) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure chart')} />;
  }

  return (
    <ErrorBoundary
      onError={console.error}
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setErrorKey((v) => v + 1);
      }}
      resetKeys={[option]}
    >
      <ECharts key={errorKey} ref={ref} onRefReady={onRefReady} option={option} />
    </ErrorBoundary>
  );
});
