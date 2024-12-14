/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { uid } from '@formily/shared';
import { useAPIClient } from '@nocobase/client';
import { Empty, Result, Spin, Typography } from 'antd';
import React, { useContext, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useChart } from '../chart/group';
import { useData, useFieldTransformer, useFieldsWithAssociation } from '../hooks';
import { useChartsTranslation } from '../locale';
import { getField } from '../utils';
import { ChartRendererDesigner } from './ChartRendererDesigner';
import { ChartRendererContext } from './ChartRendererProvider';
const { Paragraph, Text } = Typography;

const ErrorFallback = ({ error }) => {
  const { t } = useChartsTranslation();

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

export const ChartRenderer: React.FC & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const ctx = useContext(ChartRendererContext);
  const { config, transform, dataSource, collection, service, data: _data } = ctx;
  const fields = useFieldsWithAssociation(dataSource, collection);
  const data = useData(_data, dataSource, collection);
  const general = config?.general || {};
  const advanced = config?.advanced || {};
  const api = useAPIClient();
  const chart = useChart(config?.chartType);
  const locale = api.auth.getLocale();
  const transformers = useFieldTransformer(transform, locale);
  // error key is used for resetting error boundary when config changes
  const [errorKey, setErrorKey] = React.useState(uid());
  useEffect(() => {
    setErrorKey(uid());
  }, [config]);

  if (!chart) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure chart')} />;
  }

  if (!(data && data.length) && !service.loading) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />;
  }

  const chartProps = chart.getProps({
    data,
    general,
    advanced,
    fieldProps: Object.keys(data[0] || {}).reduce((props, name) => {
      if (!props[name]) {
        const field = getField(fields, name.split('.'));
        const transformer = transformers[name];
        props[name] = { label: field?.label || name, transformer, interface: field?.interface };
      }
      return props;
    }, {}),
  });
  const compiledProps = Schema.compile(chartProps);
  const C = chart.Component;

  return (
    <Spin spinning={service.loading}>
      <ErrorBoundary key={errorKey} onError={console.error} FallbackComponent={ErrorFallback}>
        {!service.loading && <C {...compiledProps} />}
      </ErrorBoundary>
    </Spin>
  );
};

ChartRenderer.Designer = ChartRendererDesigner;
