import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  gridRowColWrap,
  SchemaSettings,
  useAPIClient,
  useCollection,
  useDesignable,
  useRequest,
} from '@nocobase/client';
import { Empty, Result, Typography } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChartConfigContext } from '../block';
import { useFieldsWithAssociation, useFieldTransformer } from '../hooks';
import { useChartsTranslation } from '../locale';
import { createRendererSchema, getField, parseField, processData } from '../utils';
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
  const fields = useFieldsWithAssociation(collection);
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
                const { alias } = parseField(item.field);
                dimension.alias = alias;
              }
              return dimension;
            }),
            measures: (query?.measures || []).map((item: MeasureProps) => {
              const measure = { ...item };
              if (item.aggregation && !item.alias) {
                const { alias } = parseField(item.field);
                measure.alias = alias;
              }
              return measure;
            }),
          },
        })
        .then((res) => {
          const data = res?.data?.data || [];
          return processData(fields, data, { t });
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
  const { name, title } = useCollection();
  return (
    <GeneralSchemaDesigner disableInitializer title={title || name}>
      <SchemaSettings.Item
        key="configure"
        onClick={() => {
          setCurrent({ schema, field, collection: name });
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
