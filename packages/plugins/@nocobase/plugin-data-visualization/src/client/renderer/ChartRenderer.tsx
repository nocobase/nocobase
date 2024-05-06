/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  gridRowColWrap,
  useAPIClient,
  useCollection_deprecated,
  useDataSource,
  useDesignable,
} from '@nocobase/client';
import { Empty, Result, Spin, Typography } from 'antd';
import React, { useContext, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChartConfigContext } from '../configure';
import { useData, useFieldTransformer, useFieldsWithAssociation } from '../hooks';
import { useChartsTranslation } from '../locale';
import { createRendererSchema, getField } from '../utils';
import { ChartRendererContext } from './ChartRendererProvider';
import { useChart } from '../chart/group';
import { ChartDataContext } from '../block/ChartDataProvider';
import { Schema } from '@formily/react';
const { Paragraph, Text } = Typography;

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
  const chartProps = chart?.getProps({
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
  const C = chart?.Component;

  if (!chart) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure chart')} />;
  }
  if (!(data && data.length) && !service.loading) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />;
  }

  return (
    <Spin spinning={service.loading}>
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <C {...compiledProps} />
      </ErrorBoundary>
    </Spin>
  );
};

ChartRenderer.Designer = function Designer() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const { removeChart } = useContext(ChartDataContext);
  const { service } = useContext(ChartRendererContext);
  const field = useField();
  const schema = useFieldSchema();
  const { insertAdjacent } = useDesignable();
  const dataSource = useDataSource();
  const { name, title } = useCollection_deprecated();
  return (
    <GeneralSchemaDesigner disableInitializer title={title || name}>
      <SchemaSettingsItem
        title="Configure"
        key="configure"
        onClick={async () => {
          setCurrent({ schema, field, dataSource: dataSource.key, collection: name, service, data: service.data });
          setVisible(true);
        }}
      >
        {t('Configure')}
      </SchemaSettingsItem>
      <SchemaSettingsItem
        title="Duplicate"
        key="duplicate"
        onClick={() => insertAdjacent('afterEnd', gridRowColWrap(createRendererSchema(schema?.['x-decorator-props'])))}
      >
        {t('Duplicate')}
      </SchemaSettingsItem>
      {/* <SchemaSettingsBlockTitleItem /> */}
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        // removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ChartV2Block',
        }}
        confirm={{
          onOk: () => {
            removeChart(schema['x-uid']);
          },
        }}
      />
    </GeneralSchemaDesigner>
  );
};

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
