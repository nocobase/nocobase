import { RightSquareOutlined } from '@ant-design/icons';
import { ArrayItems, Editable, Form, FormCollapse, FormItem, Switch } from '@formily/antd-v5';
import { Form as FormType, ObjectField, createForm, onFieldChange, onFormInit } from '@formily/core';
import { FormConsumer, ISchema, Schema } from '@formily/react';
import {
  AutoComplete,
  Cascader,
  DatePicker,
  Filter,
  Input,
  InputNumber,
  Radio,
  SchemaComponent,
  Select,
  gridRowColWrap,
  useCollectionFieldsOptions,
  useCollectionFilterOptions,
  useDesignable,
} from '@nocobase/client';
import { Alert, App, Button, Card, Col, Modal, Row, Space, Table, Tabs, Typography } from 'antd';
import { cloneDeep, isEqual } from 'lodash';
import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useChartFields,
  useCollectionOptions,
  useFieldTypes,
  useFieldsWithAssociation,
  useFormatters,
  useOrderFieldsOptions,
  useOrderReaction,
  useTransformers,
} from '../hooks';
import { useChartsTranslation } from '../locale';
import { ChartRenderer, ChartRendererProvider, useChartTypes, useCharts } from '../renderer';
import { createRendererSchema, getField, getSelectedFields } from '../utils';
import { getConfigSchema, querySchema, transformSchema } from './schemas/configure';
const { Paragraph, Text } = Typography;

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: string;
};

export type SelectedField = {
  field: string | string[];
  alias?: string;
};

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  current?: ChartConfigCurrent;
  setCurrent?: (current: ChartConfigCurrent) => void;
  data?: any[] | string;
  setData?: (data: any[] | string) => void;
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
    runQuery?: any;
  }>;
  Config: React.FC;
  Query: React.FC;
  Transform: React.FC;
  Data: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { visible, setVisible, current } = useContext(ChartConfigContext);
  const { schema, field, collection } = current || {};
  const { dn } = useDesignable();
  const { modal } = App.useApp();
  const { insert } = props;

  const charts = useCharts();
  const fields = useFieldsWithAssociation(collection);
  const initChart = (overwrite = false) => {
    if (!form.modified) {
      return;
    }
    const chartType = form.values.config?.chartType;
    if (!chartType) {
      return;
    }
    const chart = charts[chartType];
    const init = chart?.init;
    if (!init) {
      if (overwrite) {
        form.values.config.general = {};
        form.values.config.advanced = {};
      }
      return;
    }
    const query = form.values.query;
    const selectedFields = getSelectedFields(fields, query);
    const { general, advanced } = init(selectedFields, query);
    if (general || overwrite) {
      form.values.config.general = general;
    }
    if (advanced || overwrite) {
      form.values.config.advanced = advanced || {};
    }
  };

  const [measures, setMeasures] = React.useState([]);
  const [dimensions, setDimensions] = React.useState([]);
  const queryReact = (form: FormType, reaction?: () => void) => {
    const currentMeasures = form.values.query?.measures.filter((item) => item.field) || [];
    const currentDimensions = form.values.query?.dimensions.filter((item) => item.field) || [];
    if (isEqual(currentMeasures, measures) && isEqual(currentDimensions, dimensions)) {
      return;
    }
    reaction?.();
    setMeasures(cloneDeep(currentMeasures));
    setDimensions(cloneDeep(currentDimensions));
  };
  const chartTypes = useChartTypes();
  const form = useMemo(
    () => {
      const chartType = chartTypes[0]?.children?.[0]?.value;
      return createForm({
        values: { config: { chartType }, ...schema?.['x-decorator-props'], collection, data: '' },
        effects: (form) => {
          onFieldChange('config.chartType', () => initChart(true));
          onFormInit(() => queryReact(form));
        },
      });
    },
    // visible, collection added here to re-initialize form when visible, collection change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, visible, collection],
  );

  const runQuery = useRef(null);
  const RunButton: React.FC = () => {
    const [loading, setLoading] = React.useState(false);
    return (
      <Button
        type="link"
        loading={loading}
        icon={<RightSquareOutlined />}
        onClick={async () => {
          const queryField = form.query('query').take() as ObjectField;
          try {
            await queryField?.validate();
          } catch (e) {
            return;
          }

          setLoading(true);
          try {
            await runQuery?.current(form.values.query);
          } catch (e) {
            console.log(e);
          }
          queryReact(form, initChart);
          setLoading(false);
        }}
      >
        {t('Run query')}
      </Button>
    );
  };

  const queryRef = useRef(null);
  const configRef = useRef(null);
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
          queryRef.current.scrollTop = 0;
          configRef.current.scrollTop = 0;
          return;
        }
        insert(createRendererSchema(rendererProps), {
          onSuccess: () => setVisible(false),
          wrap: gridRowColWrap,
        });
      }}
      onCancel={() => {
        modal.confirm({
          title: t('Are you sure to cancel?'),
          content: t('You changes are not saved. If you click OK, your changes will be lost.'),
          okButtonProps: {
            danger: true,
          },
          onOk: () => {
            setVisible(false);
            queryRef.current.scrollTop = 0;
            configRef.current.scrollTop = 0;
          },
        });
      }}
      width={'95%'}
      bodyStyle={{
        background: 'rgba(128, 128, 128, 0.08)',
      }}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={8}>
          <Col span={7}>
            <Card
              style={{
                height: 'calc(100vh - 300px)',
                overflow: 'auto',
              }}
              ref={queryRef}
            >
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
                    children: <ChartConfigure.Data />,
                  },
                ]}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card
              style={{
                height: 'calc(100vh - 300px)',
                overflow: 'auto',
              }}
              ref={configRef}
            >
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
          <Col span={11}>
            <Card>
              <ChartConfigure.Renderer runQuery={runQuery} />
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
            <ChartRenderer configuring={true} {...props} />
          </ChartRendererProvider>
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Query = function Query() {
  const { t } = useChartsTranslation();
  const { t: lang } = useTranslation();
  const fields = useFieldsWithAssociation();
  const useFormatterOptions = useFormatters(fields);
  const collectionOptions = useCollectionOptions();
  const { current, setCurrent } = useContext(ChartConfigContext);
  const { collection } = current || {};
  const fieldOptions = useCollectionFieldsOptions(collection, 1);
  const compiledFieldOptions = Schema.compile(fieldOptions, { t: lang });
  const filterOptions = useCollectionFilterOptions(collection);
  const formCollapse = FormCollapse.createFormCollapse(['measures', 'dimensions', 'filter', 'sort']);
  const onCollectionChange = (value: string) => {
    const { schema, field } = current;
    const newSchema = { ...schema };
    newSchema['x-decorator-props'] = { collection: value };
    newSchema['x-acl-action'] = `${value}:list`;
    setCurrent({
      schema: newSchema,
      field,
      collection: value,
    });
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
        fieldOptions: compiledFieldOptions,
        filterOptions,
        useOrderOptions: useOrderFieldsOptions(compiledFieldOptions, fields),
        collectionOptions,
        useFormatterOptions,
        onCollectionChange,
        collection: current?.collection,
        useOrderReaction: useOrderReaction(compiledFieldOptions, fields),
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
        Cascader,
      }}
    />
  );
};

ChartConfigure.Config = function Config() {
  const { t } = useChartsTranslation();
  const chartTypes = useChartTypes();
  const fields = useFieldsWithAssociation();
  const charts = useCharts();
  const getChartFields = useChartFields(fields);
  const getReference = (chartType: string) => {
    const reference = charts[chartType]?.reference;
    if (!reference) return '';
    const { title, link } = reference;
    return (
      <span>
        {t('Config reference: ')}
        <a href={link} target="_blank" rel="noreferrer">
          {t(title)}
        </a>
      </span>
    );
  };

  return (
    <FormConsumer>
      {(form) => {
        const chartType = form.values.config?.chartType;
        const chart = charts[chartType];
        const schema = chart?.schema || {};
        return (
          <SchemaComponent
            schema={getConfigSchema(schema)}
            scope={{ t, chartTypes, useChartFields: getChartFields, getReference }}
            components={{ Card, Select, Input, FormItem, ArrayItems, Space, AutoComplete }}
          />
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Transform = function Transform() {
  const { t } = useChartsTranslation();
  const fields = useFieldsWithAssociation();
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

ChartConfigure.Data = function Data() {
  const { data } = useContext(ChartConfigContext);
  const fields = useFieldsWithAssociation();
  return Array.isArray(data) ? (
    <Table
      dataSource={data}
      columns={Object.keys(data[0] || {}).map((col) => {
        const field = getField(fields, col.split('.'));
        return {
          title: field?.label || col,
          dataIndex: col,
          key: col,
        };
      })}
      size="small"
    />
  ) : (
    <Alert message="Error" type="error" description={data} showIcon />
  );
};
