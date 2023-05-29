import { GeneralSchemaDesigner, SchemaSettings, useRequest } from '@nocobase/client';
import React, { useContext, useEffect } from 'react';
import { Empty, Result, Typography } from 'antd';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block';
import { useFieldSchema, useField } from '@formily/react';
import { useChartComponent } from './ChartLibrary';
import { ErrorBoundary } from 'react-error-boundary';
const { Paragraph, Text } = Typography;

export type ChartRendererProps = {
  collection: string;
  query?: Partial<{
    measures: {
      field: string;
      aggregate?: string;
      alias?: string;
    }[];
    dimensions: {
      field: string;
      alias?: string;
      format?: string;
    }[];
    sort: {
      field: string;
      order: 'asc' | 'desc';
    };
    filter: any;
  }>;
  config?: {
    chartType: string;
    general: any;
    advanced: string;
  };
};

export const ChartRenderer: React.FC<ChartRendererProps> & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();

  const { query, config, collection } = props;
  const general = config?.general || {};
  let advanced = {};
  try {
    advanced = JSON.parse(config?.advanced || '{}');
  } catch (err) {
    console.error(err);
  }

  const {
    data = [],
    loading,
    run,
  } = useRequest(
    {
      url: 'charts:query',
      params: {
        collection,
        ...query,
      },
    },
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (query?.measures?.length && query?.dimensions?.length) {
      run();
    }
  }, [query, run]);

  const chartType = config?.chartType || '-';
  const [library, type] = chartType.split('-');
  const Component = useChartComponent(library, type);

  const C = () =>
    Component ? (
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <Component {...{ ...general, ...advanced, data }} />
      </ErrorBoundary>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Chart not configured.')} />
    );

  return <C />;
};

ChartRenderer.Designer = function Designer() {
  const { t } = useChartsTranslation();
  const { setVisible, setCurrent } = useContext(ChartConfigContext);
  const field = useField();
  const schema = useFieldSchema();
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.Item
        key="configure"
        onClick={() => {
          setCurrent({ schema, field, collection: field?.componentProps?.collection });
          setVisible(true);
        }}
      >
        {t('Configure')}
      </SchemaSettings.Item>
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
