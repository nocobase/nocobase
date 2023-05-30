import { GeneralSchemaDesigner, SchemaSettings, useAPIClient, useRequest } from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { Empty, Result, Typography } from 'antd';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block';
import { useFieldSchema, useField } from '@formily/react';
import { useChart } from './ChartLibrary';
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
  // A flag to indicate whether it is the renderer of the configuration pane.
  configuring?: boolean;
};

export const ChartRenderer: React.FC<ChartRendererProps> & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { setData: setQueryData } = useContext(ChartConfigContext);
  const { query, config, collection, configuring } = props;
  const general = config?.general || {};
  let advanced = {};
  try {
    advanced = JSON.parse(config?.advanced || '{}');
  } catch (err) {
    console.error(err);
  }

  const api = useAPIClient();
  const [data, setData] = useState<any[]>([]);
  const { loading, run } = useRequest(
    () =>
      api
        .request({
          url: 'charts:query',
          method: 'POST',
          data: {
            collection,
            ...query,
          },
        })
        .then((res) => {
          return res?.data?.data || [];
        }),
    {
      manual: true,
      onSuccess: (data) => {
        setData(data);
        if (configuring) {
          const sampleData = data.length > 10 ? data.slice(0, 10) : data;
          setQueryData(JSON.stringify(sampleData, null, 2));
        }
      },
    },
  );

  useEffect(() => {
    if (query?.measures?.length && query?.dimensions?.length) {
      run();
    }
  }, [run]);

  const chartType = config?.chartType || '-';
  const [library, type] = chartType.split('-');
  const chart = useChart(library, type);
  const Component = chart.component;
  const transformer = chart.transformer;

  const C = () =>
    Component ? (
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <Component {...{ ...general, ...advanced, data: transformer ? transformer(data) : data }} />
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
