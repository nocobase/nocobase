import {
  GeneralSchemaDesigner,
  SchemaSettings,
  gridRowColWrap,
  useAPIClient,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { Empty, Result, Typography } from 'antd';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block';
import { useFieldSchema, useField } from '@formily/react';
import { useChart } from './ChartLibrary';
import { ErrorBoundary } from 'react-error-boundary';
import { useFields, useQueryWithAlias, useFieldTransformer } from '../hooks';
const { Paragraph, Text } = Typography;

export type QueryProps = Partial<{
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
  orders: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  filter: any;
  limit: number;
  sql: {
    fields?: string;
    clauses?: string;
  };
}>;

export type ChartRendererProps = {
  collection: string;
  query?: QueryProps;
  config?: {
    chartType: string;
    general: any;
    advanced: string;
  };
  transform?: {
    field: string;
    type: string;
    format: string;
  }[];
  // A flag to indicate whether it is the renderer of the configuration pane.
  configuring?: boolean;
  mode?: 'builder' | 'sql';
};

export const ChartRenderer: React.FC<ChartRendererProps> & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { setData: setQueryData, current } = useContext(ChartConfigContext);
  const { query, config, collection, transform, configuring } = props;
  const general = config?.general || {};
  const advanced = config?.advanced || {};

  const schema = useFieldSchema();
  const currentSchema = schema || current?.schema;
  const fields = useFields(collection);
  const queryWithAlias = useQueryWithAlias(fields, query);
  const api = useAPIClient();
  const [data, setData] = useState<any[]>([]);
  const { loading, run } = useRequest(
    () =>
      api
        .request({
          url: 'charts:query',
          method: 'POST',
          data: {
            uid: currentSchema?.['x-uid'],
            collection,
            ...queryWithAlias,
          },
        })
        .then((res) => {
          return res?.data?.data || [];
        }),
    {
      manual: true,
      onSuccess: (data) => {
        setData(data);
      },
      onFinally(params, data, e) {
        if (!configuring) {
          return;
        }
        if (e) {
          setQueryData(e.stack);
          return;
        }
        const sampleData = data.length > 10 ? data.slice(0, 10) : data;
        setQueryData(JSON.stringify(sampleData, null, 2));
      },
    },
  );

  /*
   * For a renderer of a configured chart,
   * only trigger requests when query parameters are really changed
   * For the renderer of the configuration pane,
   * trigger requests when "run query" button is clicked
   */
  const changedQuery = configuring ? query : JSON.stringify(query);
  useEffect(() => {
    if ((query?.measures?.length && query?.dimensions?.length) || (query?.sql?.fields && query?.sql?.clauses)) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changedQuery, run]);

  const chartType = config?.chartType || '-';
  const [library, type] = chartType.split('-');
  const chart = useChart(library, type);
  const Component = chart?.component;
  const meta = useFieldTransformer(transform);
  const chartTansformer = chart?.transformer;
  const C = () =>
    Component ? (
      <ErrorBoundary
        onError={(error) => {
          console.error(error);
        }}
        FallbackComponent={ErrorFallback}
      >
        <Component {...{ data: chartTansformer ? chartTansformer(data) : data, meta, ...general, ...advanced }} />
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
  const { insertAdjacent } = useDesignable();
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
      <SchemaSettings.Item
        key="duplicate"
        onClick={() =>
          insertAdjacent(
            'afterEnd',
            {
              type: 'void',
              'x-decorator': 'CardItem',
              'x-component': 'ChartRenderer',
              'x-component-props': schema['x-component-props'],
              'x-initializer': 'ChartInitializers',
              'x-designer': 'ChartRenderer.Designer',
            },
            {
              wrap: gridRowColWrap,
            },
          )
        }
      >
        {t('Duplicate')}
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
