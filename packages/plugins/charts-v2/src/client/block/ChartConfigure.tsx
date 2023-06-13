import { useChartsTranslation } from '../locale';
import React, { createContext, useContext, useMemo } from 'react';
import { Row, Col, Card, Modal, Button, Space, Tabs, Typography } from 'antd';
import { ArrayItems, Editable, FormCollapse, Switch } from '@formily/antd';
import {
  SchemaComponent,
  Filter,
  gridRowColWrap,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Radio,
  useDesignable,
  useFilterFieldOptions,
  AutoComplete,
} from '@nocobase/client';
import { css } from '@emotion/css';
import { getConfigSchema, querySchema, transformSchema } from './schemas/configure';
import { ISchema, FormConsumer } from '@formily/react';
import { ChartLibraryContext, ChartRenderer, ChartRendererProvider, useChartTypes } from '../renderer';
import { Form, FormItem } from '@formily/antd';
import { RightSquareOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import {
  useFields,
  useChartFields,
  useFormatters,
  useCollectionOptions,
  useTransformers,
  useFieldTypes,
} from '../hooks';
import { cloneDeep } from 'lodash';
import { createRendererSchema } from '../utils';
const { Paragraph, Text } = Typography;

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: string;
};

export type SelectedField = {
  field: string;
  alias?: string;
};

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  current?: ChartConfigCurrent;
  setCurrent?: (current: ChartConfigCurrent) => void;
  data?: string;
  setData?: (data: string) => void;
}>({
  visible: true,
});

export const ChartConfigure: React.FC<{
  insert: (
    s: ISchema,
    options: {
      onSuccess: () => void;
      wrap?: (schema: ISchema) => ISchema;
    },
  ) => void;
}> & {
  Renderer: React.FC<{
    beforeQuery?: () => void;
    afterQuery?: () => void;
  }>;
  Config: React.FC;
  Query: React.FC;
  Transform: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { visible, setVisible, current, data } = useContext(ChartConfigContext);
  const { schema, field, collection } = current || {};
  const { dn } = useDesignable();
  const { insert } = props;
  const form = useMemo(
    () =>
      createForm({
        values: { ...schema?.['x-decorator-props'], collection, data: '' },
      }),
    // visible, collection added here to re-initialize form when visible, collection change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, visible, collection],
  );
  const [loading, setLoading] = React.useState(false);
  const RunButton: React.FC = () => (
    <Button
      type="link"
      loading={loading}
      icon={<RightSquareOutlined />}
      // apply cloneDeep to trigger form change and ChartRenderer will rerender
      onClick={() => (form.values.query = cloneDeep(form.values.query))}
    >
      {t('Run query')}
    </Button>
  );
  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        const { query, config, transform, mode } = form.values;
        const rendererProps = {
          query,
          config,
          collection,
          transform,
          mode: mode || 'builder',
        };
        if (schema && schema['x-uid']) {
          schema['x-decorator-props'] = rendererProps;
          field.decoratorProps = rendererProps;
          field['x-acl-action'] = `${collection}:list`;
          dn.emit('patch', {
            schema,
          });
          setVisible(false);
          return;
        }
        insert(createRendererSchema(rendererProps), {
          onSuccess: () => setVisible(false),
          wrap: gridRowColWrap,
        });
      }}
      onCancel={() => setVisible(false)}
      maskClosable={false}
      width={'95%'}
      bodyStyle={{
        background: 'rgba(128, 128, 128, 0.08)',
      }}
    >
      <Form layout="vertical" form={form}>
        <Row
          gutter={8}
          style={{
            height: 'calc(100vh - 300px)',
            overflow: 'scroll',
          }}
        >
          <Col span={15}>
            <Row>
              <Col
                className={css`
                  width: 100%;
                `}
              >
                <Card
                  className={css`
                    margin-bottom: 10px;
                  `}
                >
                  <ChartConfigure.Renderer beforeQuery={() => setLoading(true)} afterQuery={() => setLoading(false)} />
                </Card>
              </Col>
            </Row>
            <Row>
              <Col
                className={css`
                  width: 100%;
                `}
              >
                <Card>
                  <Tabs
                    items={[
                      {
                        label: t('Chart'),
                        key: 'chart',
                        children: <ChartConfigure.Config />,
                      },
                      {
                        label: t('Transform'),
                        key: 'transform',
                        children: <ChartConfigure.Transform />,
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
          <Col span={9}>
            <Card>
              <Tabs
                tabBarExtraContent={<RunButton />}
                items={[
                  {
                    label: t('Query'),
                    key: 'query',
                    children: <ChartConfigure.Query />,
                  },
                  {
                    label: t('Data'),
                    key: 'data',
                    children: (
                      <Paragraph ellipsis={true}>
                        <Text>{t('The first 10 records of the query result:')}</Text>
                        <pre
                          className={css`
                            max-height: 700px;
                            overflow: scroll;
                          `}
                        >
                          <Text>{data || t('Please run query to retrive data.')}</Text>
                        </pre>
                      </Paragraph>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

ChartConfigure.Renderer = function Renderer(props) {
  const { current } = useContext(ChartConfigContext);
  const { collection } = current || {};
  return (
    <FormConsumer>
      {(form) => {
        // Any change of config and transform will trigger rerender
        // Change of query only trigger rerender when "Run query" button is clicked
        const config = cloneDeep(form.values.config);
        const transform = cloneDeep(form.values.transform);
        return (
          <ChartRendererProvider
            collection={collection}
            query={form.values.query}
            config={config}
            transform={transform}
            mode={form.values.mode}
          >
            <ChartRenderer configuring={true} beforeQuery={props.beforeQuery} afterQuery={props.afterQuery} />
          </ChartRendererProvider>
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Query = function Query() {
  const { t } = useChartsTranslation();
  const fields = useFields();
  const useFormatterOptions = useFormatters(fields);
  const filterOptions = useFilterFieldOptions(fields);
  const collectionOptions = useCollectionOptions();
  const { current, setCurrent, setData } = useContext(ChartConfigContext);
  const formCollapse = FormCollapse.createFormCollapse(['measures', 'dimensions', 'sort', 'filter']);
  const onCollectionChange = (value: string) => {
    const { schema, field } = current;
    schema['x-decorator-props'] = { collection: value };
    schema['x-acl-action'] = `${value}:list`;
    setCurrent({
      schema,
      field,
      collection: value,
    });
    setData('');
  };
  const FromSql = () => (
    <Text code>
      From <span style={{ color: '#1890ff' }}>{current?.collection}</span>
    </Text>
  );
  return (
    <SchemaComponent
      schema={querySchema}
      scope={{
        t,
        formCollapse,
        fields,
        filterOptions,
        collectionOptions,
        useFormatterOptions,
        onCollectionChange,
        collection: current?.collection,
      }}
      components={{
        ArrayItems,
        Editable,
        FormCollapse,
        Card,
        Switch,
        Select,
        Input,
        InputNumber,
        FormItem,
        Radio,
        Space,
        Filter,
        DatePicker,
        Text,
        FromSql,
      }}
    />
  );
};

ChartConfigure.Config = function Config() {
  const { t } = useChartsTranslation();
  const chartTypes = useChartTypes();
  const fields = useFields();
  const libraries = useContext(ChartLibraryContext);
  const getChartFields = useChartFields(fields);
  return (
    <FormConsumer>
      {(form) => {
        const getSchema = (type: string) => {
          if (!type) {
            return {};
          }
          const [library, chart] = type.split('-');
          return libraries[library]?.charts[chart]?.schema || {};
        };
        const chartType = form.values.config?.chartType;
        const schema = getSchema(chartType);
        return (
          <SchemaComponent
            schema={getConfigSchema(schema)}
            scope={{ t, chartTypes, useChartFields: getChartFields }}
            components={{ Card, Select, Input, FormItem, ArrayItems, Space, AutoComplete }}
          />
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Transform = function Transform() {
  const { t } = useChartsTranslation();
  const fields = useFields();
  const useFieldTypeOptions = useFieldTypes(fields);
  const getChartFields = useChartFields(fields);
  return (
    <SchemaComponent
      schema={transformSchema}
      components={{ Select, FormItem, ArrayItems, Space }}
      scope={{ useChartFields: getChartFields, useFieldTypeOptions, useTransformers, t }}
    />
  );
};
