/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ECharts from './ECharts';
import { Empty, Result, Typography } from 'antd';
import { EChartsOption } from 'echarts';
import { ErrorBoundary } from 'react-error-boundary';
import { useT } from '../../locale';
const { Paragraph, Text } = Typography;

export interface ChartOptions {
  option: EChartsOption;
  dataSource: any;
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

export const Chart: React.FC<ChartOptions> = ({ option, dataSource }) => {
  if (!option || (!option.dataset && !dataSource)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'Please configure chart'} />;
  }

  return (
    <ErrorBoundary onError={console.error} FallbackComponent={ErrorFallback}>
      <ECharts
        option={{
          dataset: {
            source: dataSource,
          },
          ...option,
        }}
      />
    </ErrorBoundary>
  );
};
