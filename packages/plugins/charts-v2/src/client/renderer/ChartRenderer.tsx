import { Schema, useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  gridRowColWrap,
  SchemaSettings,
  useAPIClient,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import { Empty, Result, Typography } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChartConfigContext } from '../block';
import { useCompiledFields, useFieldTransformer } from '../hooks';
import { useChartsTranslation } from '../locale';
import { createRendererSchema, processData } from '../utils';
import { useCharts } from './ChartLibrary';
import { ChartRendererContext, DimensionProps, MeasureProps, QueryProps } from './ChartRendererProvider';
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
            ...query,
            dimensions: (query?.dimensions || []).map((item: DimensionProps) => {
              const dimension = { ...item };
              if (item.format && !item.alias) {
                dimension.alias = item.field;
              }
              return dimension;
            }),
            measures: (query?.measures || []).map((item: MeasureProps) => {
              const measure = { ...item };
              if (item.aggregation && !item.alias) {
                measure.alias = item.field;
              }
              return measure;
            }),
          },
        })
        .then((res) => {
          const data = res?.data?.data || [];
          return processData(fields, data);
        }),
    {
      manual: true,
      onSuccess: (data) => {
        setData(data);
      },
      onFinally(params, data, error: any) {
        if (!configuring) {
          return;
        }
        if (error) {
          const message = error?.response?.data?.errors?.map?.((error: any) => error.message).join('\n');
          setQueryData(message || error.message);
          return;
        }
        setQueryData(data);
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

  const charts = useCharts();
  const chart = charts[config?.chartType];
  const Component = chart?.component;
  const locale = api.auth.getLocale();
  const meta = useFieldTransformer(transform, locale);
  const info = Schema.compile({ data, meta, general, advanced }, { t });
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
