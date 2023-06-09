import {
  GeneralSchemaDesigner,
  SchemaSettings,
  gridRowColWrap,
  useAPIClient,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { Empty, Result, Typography, message } from 'antd';
import { useChartsTranslation } from '../locale';
import { ChartConfigContext } from '../block';
import { useFieldSchema, useField } from '@formily/react';
import { useChart } from './ChartLibrary';
import { ErrorBoundary } from 'react-error-boundary';
import { useFields, useQueryWithAlias, useFieldTransformer } from '../hooks';
import { createRendererSchema } from '../utils';
import { ChartRendererContext } from './ChartRendererProvider';
const { Paragraph, Text } = Typography;

export const ChartRenderer: React.FC<{
  configuring?: boolean;
  beforeQuery?: () => void;
  afterQuery?: () => void;
}> & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { setData: setQueryData, current } = useContext(ChartConfigContext);
  const { query, config, collection, transform } = useContext(ChartRendererContext);
  const { configuring, beforeQuery, afterQuery } = props;
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
      onBefore: () => {
        beforeQuery?.();
      },
      onSuccess: (data) => {
        setData(data);
      },
      onFinally(params, data, e) {
        afterQuery?.();
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
    if (
      query?.measures?.length
      // || (query?.sql?.fields && query?.sql?.clauses)
    ) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changedQuery, run]);

  const chartType = config?.chartType || '-';
  const [libName, type] = chartType.split('-');
  const { library, chart } = useChart(libName, type);
  const Component = chart?.component;
  const locale = api.auth.getLocale();
  const meta = useFieldTransformer(transform, locale);
  const chartTansformer = chart?.transformer;
  const info = { data: chartTansformer ? chartTansformer(data) : data, meta, general, advanced };
  const componentProps = library?.useProps(info);
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
  const collection = field?.decoratorProps?.collection;
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.Item
        key="configure"
        onClick={() => {
          setCurrent({ schema, field, collection });
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
