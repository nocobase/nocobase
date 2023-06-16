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
import { useFieldSchema, useField, Schema } from '@formily/react';
import { ErrorBoundary } from 'react-error-boundary';
import { useFieldTransformer, useCompiledFields } from '../hooks';
import { createRendererSchema, getChart, getQueryWithAlias } from '../utils';
import { ChartRendererContext, QueryProps } from './ChartRendererProvider';
import { ChartLibraryContext } from './ChartLibrary';
const { Paragraph, Text } = Typography;

export const ChartRenderer: React.FC<{
  configuring?: boolean;
  runQuery?: any;
}> & {
  Designer: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { setData: setQueryData, current } = useContext(ChartConfigContext);
  const { query, config, collection, transform } = useContext(ChartRendererContext);
  const { configuring, runQuery } = props;
  const general = config?.general || {};
  const advanced = config?.advanced || {};
  const schema = useFieldSchema();
  const currentSchema = schema || current?.schema;
  const fields = useCompiledFields(collection);
  const api = useAPIClient();
  const [data, setData] = useState<any[]>([]);
  const { runAsync } = useRequest(
    (query) =>
      api
        .request({
          url: 'charts:query',
          method: 'POST',
          data: {
            uid: currentSchema?.['x-uid'],
            collection,
            ...getQueryWithAlias(fields, query),
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

  useEffect(() => {
    setData([]);
    const run = async (query: QueryProps) => {
      if (
        query?.measures?.length
        // || (query?.sql?.fields && query?.sql?.clauses)
      ) {
        await runAsync(query);
      }
    };
    if (runQuery) {
      runQuery.current = run;
    }
    run(query);
  }, [query, runAsync, runQuery]);

  const libraries = useContext(ChartLibraryContext);
  const { library, chart } = getChart(libraries, config?.chartType);
  const Component = chart?.component;
  const locale = api.auth.getLocale();
  const meta = useFieldTransformer(transform, locale);
  const chartTansformer = chart?.transformer;
  const info = Schema.compile({ data: chartTansformer ? chartTansformer(data) : data, meta, general, advanced }, { t });
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
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure chart')} />
    );

  return data && data.length ? (
    <C />
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Please configure and run query')} />
  );
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
