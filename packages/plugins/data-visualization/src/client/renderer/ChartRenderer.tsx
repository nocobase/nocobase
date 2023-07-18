import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettings,
  gridRowColWrap,
  useAPIClient,
  useCollection,
  useDesignable,
} from '@nocobase/client';
import { Empty, Result, Spin, Typography } from 'antd';
import React, { useContext } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChartConfigContext } from '../block';
import { useFieldTransformer, useFieldsWithAssociation } from '../hooks';
import { useChartsTranslation } from '../locale';
import { createRendererSchema, getField, processData } from '../utils';
import { useCharts } from './ChartLibrary';
import { ChartRendererContext } from './ChartRendererProvider';
const { Paragraph, Text } = Typography;

export const ChartRenderer: React.FC & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const ctx = useContext(ChartRendererContext);
  const { config, transform, collection, service, data: _data } = ctx;
  const fields = useFieldsWithAssociation(collection);
  const data = processData(fields, service?.data || _data || [], { t });
  const general = config?.general || {};
  const advanced = config?.advanced || {};
  const api = useAPIClient();

  const charts = useCharts();
  const chart = charts[config?.chartType];
  const Component = chart?.component;
  const locale = api.auth.getLocale();
  const transformers = useFieldTransformer(transform, locale);
  const info = {
    data,
    general,
    advanced,
    fieldProps: Object.keys(data[0] || {}).reduce((props, name) => {
      if (!props[name]) {
        const field = getField(fields, name.split('.'));
        const transformer = transformers[name];
        props[name] = { ...field, transformer };
      }
      return props;
    }, {}),
    locale,
  };
  const componentProps = chart?.useProps?.(info) || info;
  const C = () =>
    Component ? (
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <Component {...componentProps} />
      </ErrorBoundary>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure chart')} />
    );

  if (service.loading) {
    return <Spin />;
  }

  if (!(data && data.length)) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure and run query')} />;
  }

  return <C />;
};

ChartRenderer.Designer = function Designer() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const { service } = useContext(ChartRendererContext);
  const field = useField();
  const schema = useFieldSchema();
  const { insertAdjacent } = useDesignable();
  const { name, title } = useCollection();
  return (
    <GeneralSchemaDesigner disableInitializer title={title || name}>
      <SchemaSettings.Item
        key="configure"
        onClick={() => {
          setCurrent({ schema, field, collection: name, service });
          setVisible(true);
        }}
      >
        {t('Configure')}
      </SchemaSettings.Item>
      <SchemaSettings.Item
        key="duplicate"
        onClick={() =>
          insertAdjacent('afterEnd', createRendererSchema(schema?.['x-decorator-props']), {
            wrap: gridRowColWrap,
          })
        }
      >
        {t('Duplicate')}
      </SchemaSettings.Item>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        // removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'ChartV2Block',
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
