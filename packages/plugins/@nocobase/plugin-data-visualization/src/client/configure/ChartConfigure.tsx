/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RightSquareOutlined } from '@ant-design/icons';
import { ArrayItems, Editable, FormCollapse, FormItem, FormLayout, Switch } from '@formily/antd-v5';
import { Form as FormType, ObjectField, createForm, onFieldChange, onFormInit } from '@formily/core';
import { FormConsumer, ISchema, Schema } from '@formily/react';
import {
  AutoComplete,
  FormProvider,
  SchemaComponent,
  Select,
  gridRowColWrap,
  useDesignable,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Alert, App, Button, Card, Col, Modal, Row, Space, Table, Tabs, Typography, theme } from 'antd';
import { cloneDeep, isEqual } from 'lodash';
import React, { memo, useContext, useEffect, useMemo, useRef } from 'react';
import {
  useChartFields,
  useCollectionOptions,
  useCollectionFieldsOptions,
  useCollectionFilterOptions,
  useData,
  useFieldsWithAssociation,
  useFormatters,
  useOrderFieldsOptions,
  useOrderReaction,
  useFieldTypeSelectProps,
  useArgument,
  useTransformers,
  useTransformerSelectProps,
  useFieldSelectProps,
} from '../hooks';
import { useChartsTranslation } from '../locale';
import { ChartRenderer, ChartRendererContext } from '../renderer';
import { createRendererSchema, getField, getSelectedFields } from '../utils';
import { getConfigSchema, querySchema, transformSchema } from './schemas/configure';
import { useChartTypes, useCharts, useDefaultChartType } from '../chart/group';
import { FilterDynamicComponent } from './FilterDynamicComponent';
import { ChartConfigContext } from './ChartConfigProvider';
const { Paragraph, Text } = Typography;
import { css } from '@emotion/css';
import { TransformerDynamicComponent } from './TransformerDynamicComponent';

export type SelectedField = {
  field: string | string[];
  alias?: string;
};

export const ChartConfigure: React.FC<{
  insert: (
    s: ISchema,
    options: {
      onSuccess: () => void;
      wrap?: (schema: ISchema) => ISchema;
    },
  ) => void;
}> & {
  Renderer: React.FC;
  Config: React.FC;
  Query: React.FC;
  Transform: React.FC;
  Data: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { service } = useContext(ChartRendererContext);
  const { visible, setVisible, current } = useContext(ChartConfigContext);
  const { schema, field, dataSource, collection, initialValues } = current || {};
  const { dn } = useDesignable();
  const { modal } = App.useApp();
  const { insert } = props;

  const charts = useCharts();
  const fields = useFieldsWithAssociation(dataSource, collection);
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
    const { general, advanced } = chart.init(selectedFields, query);
    if (general || overwrite) {
      form.setInitialValuesIn('config.general', {});
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
  const chartType = useDefaultChartType();
  const form = useMemo(
    () => {
      const decoratorProps = initialValues || schema?.['x-decorator-props'];
      const config = decoratorProps?.config || {};
      return createForm({
        values: {
          ...decoratorProps,
          config: { chartType, ...config, title: config.title || field?.componentProps?.title },
          collection: [dataSource, collection],
        },
        effects: (form) => {
          onFieldChange('config.chartType', () => initChart(true));
          onFormInit(() => queryReact(form));
        },
      });
    },
    // visible, dataSource, collection added here to re-initialize form when visible, dataSource, collection change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field, visible, dataSource, collection],
  );

  const RunButton: React.FC = memo(() => (
    <Button
      type="link"
      loading={service?.loading}
      icon={<RightSquareOutlined />}
      onClick={async () => {
        const queryField = form.query('query').take() as ObjectField;
        try {
          await queryField?.validate();
        } catch (e) {
          return;
        }

        try {
          await service.runAsync(dataSource, collection, form.values.query, true);
        } catch (e) {
          console.log(e);
        }
        queryReact(form, initChart);
      }}
    >
      {t('Run query')}
    </Button>
  ));

  const queryRef = useRef(null);
  const configRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    service.run(collection, field?.decoratorProps?.query, 'configure');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        const { query, config, transform, mode } = form.values;
        const { title, bordered } = config || {};
        const afterSave = () => {
          setVisible(false);
          current.service?.run(dataSource, collection, query);
          queryRef.current.scrollTop = 0;
          configRef.current.scrollTop = 0;
          service.mutate(undefined);
        };
        const rendererProps = {
          query,
          config,
          dataSource,
          collection,
          transform,
          mode: mode || 'builder',
        };
        if (schema && schema['x-uid']) {
          schema['x-component-props'] = {
            ...schema['x-component-props'],
            title,
            bordered,
          };
          schema['x-decorator-props'] = rendererProps;
          field.decoratorProps = rendererProps;
          field.componentProps = {
            ...field.componentProps,
            title,
            bordered,
          };
          field['x-acl-action'] = `${collection}:list`;
          dn.emit('patch', {
            schema,
          });
          afterSave();
          return;
        }
        insert(gridRowColWrap(createRendererSchema(rendererProps)), {
          onSuccess: afterSave,
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
            service.mutate(undefined);
          },
        });
      }}
      width={'95%'}
      className={css`
        .ant-modal-content {
          padding: 0;
        }
      `}
      styles={{
        header: {
          padding: '12px 24px 0px 24px',
        },
        body: {
          background: 'rgba(128, 128, 128, 0.08)',
        },
        footer: {
          padding: '0px 24px 12px 24px',
        },
      }}
    >
      <FormProvider form={form}>
        <FormLayout layout="vertical">
          <Row gutter={8}>
            <Col span={7}>
              <Card
                style={{
                  height: 'calc(100vh - 288px)',
                  overflow: 'auto',
                  margin: '6px 0 6px 12px',
                }}
                bodyStyle={{ padding: '0 16px' }}
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
                  height: 'calc(100vh - 288px)',
                  overflow: 'auto',
                  margin: '6px 0',
                }}
                bodyStyle={{ padding: '0 16px 10px 16px' }}
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
                      label: t('Transformation'),
                      key: 'transformation',
                      children: <ChartConfigure.Transform />,
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col span={11}>
              <ChartConfigure.Renderer />
            </Col>
          </Row>
        </FormLayout>
      </FormProvider>
    </Modal>
  );
};

ChartConfigure.Renderer = function Renderer(props) {
  const { current } = useContext(ChartConfigContext);
  const { collection, data } = current || {};
  const { service } = useContext(ChartRendererContext);
  return (
    <FormConsumer>
      {(form) => {
        // Any change of config and transform will trigger rerender
        // Change of query only trigger rerender when "Run query" button is clicked
        const config = cloneDeep(form.values.config);
        const transform = cloneDeep(form.values.transform);
        return (
          <Card
            size="small"
            title={form.values.config?.title}
            style={{
              margin: '6px 12px 6px 0',
            }}
            bordered={form.values.config?.bordered}
          >
            <ChartRendererContext.Provider value={{ collection, config, transform, service, data }}>
              <ChartRenderer {...props} />
            </ChartRendererContext.Provider>
          </Card>
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Query = function Query() {
  const { t } = useChartsTranslation();
  const fields = useFieldsWithAssociation();
  const useFormatterOptions = useFormatters(fields);
  const collectionOptions = useCollectionOptions();
  const { current, setCurrent } = useContext(ChartConfigContext);
  const { dataSource, collection } = current || {};
  const fieldOptions = useCollectionFieldsOptions(dataSource, collection, 1);
  const compiledFieldOptions = Schema.compile(fieldOptions, { t });
  const filterOptions = useCollectionFilterOptions(dataSource, collection);
  const { token } = theme.useToken();

  const { service } = useContext(ChartRendererContext);
  const onCollectionChange = (value: string[]) => {
    const { schema, field } = current;
    const [dataSource, collection] = value;
    setCurrent({
      schema,
      field,
      collection,
      dataSource,
      service: current.service,
      initialValues: {},
      data: undefined,
    });
    service.mutate(undefined);
  };

  const formCollapse = FormCollapse.createFormCollapse(['measures', 'dimensions', 'filter', 'sort']);
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
        collapsePanelBg: token.colorBgContainer,
      }}
      components={{ ArrayItems, Editable, FormCollapse, FormItem, Space, Switch, FromSql, FilterDynamicComponent }}
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
    const reference = charts[chartType]?.getReference?.();
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
  const formCollapse = FormCollapse.createFormCollapse(['card', 'basic']);

  return (
    <FormConsumer>
      {(form) => {
        const chartType = form.values.config?.chartType;
        const chart = charts[chartType];
        const enableAdvancedConfig = chart?.enableAdvancedConfig;
        const schema = chart?.schema || {};
        return (
          <SchemaComponent
            schema={getConfigSchema(schema, enableAdvancedConfig)}
            scope={{ t, chartTypes, useChartFields: getChartFields, getReference, formCollapse }}
            components={{ FormItem, ArrayItems, Space, AutoComplete, FormCollapse }}
          />
        );
      }}
    </FormConsumer>
  );
};

ChartConfigure.Transform = function Transform() {
  const { t } = useChartsTranslation();
  const fields = useFieldsWithAssociation();
  const getChartFields = useChartFields(fields);
  return (
    <>
      <Alert type="info" style={{ marginBottom: '20px' }} message={t('Transformation tip')} closable />
      <div
        className={css`
          .ant-formily-item-feedback-layout-loose {
            margin-bottom: 0;
          }
          .ant-space {
            margin-bottom: 15px;
          }
        `}
      >
        <SchemaComponent
          schema={transformSchema}
          components={{
            FormItem,
            ArrayItems,
            Space,
            TransformerDynamicComponent,
            Select: withDynamicSchemaProps(Select),
          }}
          scope={{
            useChartFields: getChartFields,
            useTransformers,
            useTransformerSelectProps,
            useFieldSelectProps: useFieldSelectProps(fields),
            useFieldTypeSelectProps,
            useArgument,
            t,
          }}
        />
      </div>
    </>
  );
};

ChartConfigure.Data = function Data() {
  const { service } = useContext(ChartRendererContext);
  const { current } = useContext(ChartConfigContext);
  const fields = useFieldsWithAssociation();
  const data = useData(current?.data);
  const error = service?.error;
  return !error ? (
    <Table
      dataSource={data.map((item, index) => ({ ...item, _key: index }))}
      rowKey="_key"
      scroll={{ x: 'max-content' }}
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
    <Alert
      message="Error"
      type="error"
      description={error?.response?.data?.errors?.map?.((error: any) => error.message).join('\n') || error.message}
      showIcon
    />
  );
};
