import { useChartsTranslation } from '../locale';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { Row, Col, Card, Modal, Button, Space, Tabs, Typography } from 'antd';
import { ArrayItems, Editable, FormCollapse, Switch } from '@formily/antd';
import {
  SchemaComponent,
  Filter,
  gridRowColWrap,
  Select,
  Input,
  Radio,
  useDesignable,
  useLinkageCollectionFilterOptions,
} from '@nocobase/client';
import { css } from '@emotion/css';
import { getConfigSchema, querySchema } from './schemas/configure';
import { ISchema, FormConsumer } from '@formily/react';
import { ChartLibraryContext, ChartRenderer, useChartTypes } from '../renderer';
import { Form, FormItem } from '@formily/antd';
import { RightSquareOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { useFields, useAllFields, useFormatters } from '../hooks';
import { cloneDeep } from 'lodash';
const { Paragraph, Text } = Typography;

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: any;
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
  Renderer: React.FC;
  Config: React.FC;
  Query: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { visible, setVisible, current, data } = useContext(ChartConfigContext);
  const { schema, field, collection } = current || {};
  const { dn } = useDesignable();
  const { insert } = props;

  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          query: schema?.['x-component-props']?.query,
          config: schema?.['x-component-props']?.config,
        },
      }),
    // visible added here to re-initialize form when visible changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema, visible],
  );
  const RunButton: React.FC = () => (
    // apply cloneDeep to trigger form change and ChartRenderer will rerender
    <Button type="link" onClick={() => (form.values.query = cloneDeep(form.values.query))}>
      <RightSquareOutlined />
      {t('Run query')}
    </Button>
  );
  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        const { query, config } = form.values;
        const rendererProps = {
          query,
          config,
          collection,
        };
        if (schema && schema['x-uid']) {
          schema['x-component-props'] = rendererProps;
          field.componentProps = rendererProps;
          dn.emit('patch', {
            schema,
          });
          setVisible(false);
          return;
        }
        insert(
          {
            type: 'void',
            'x-decorator': 'CardItem',
            'x-component': 'ChartRenderer',
            'x-component-props': rendererProps,
            'x-initializer': 'ChartInitializers',
            'x-designer': 'ChartRenderer.Designer',
          },
          {
            onSuccess: () => setVisible(false),
            wrap: gridRowColWrap,
          },
        );
      }}
      onCancel={() => setVisible(false)}
      maskClosable={false}
      width={'95%'}
      bodyStyle={{
        background: 'rgba(128, 128, 128, 0.08)',
      }}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={8}>
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
                  <ChartConfigure.Renderer />
                </Card>
              </Col>
            </Row>
            <Row>
              <Col
                className={css`
                  width: 100%;
                `}
              >
                <ChartConfigure.Config />
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

ChartConfigure.Renderer = function Renderer() {
  const { current } = useContext(ChartConfigContext);
  const { collection } = current || {};
  return (
    <FormConsumer>
      {(form) => {
        // Any change of config will trigger rerender
        // Change of query only trigger rerender when "Run query" button is clicked
        const config = cloneDeep(form.values.config);
        return <ChartRenderer collection={collection} query={form.values.query} config={config} configuring={true} />;
      }}
    </FormConsumer>
  );
};

ChartConfigure.Query = function Query() {
  const { t } = useChartsTranslation();
  const { current } = useContext(ChartConfigContext);
  const { collection } = current || {};
  const fields = useFields();
  const useFormatterOptions = useFormatters(fields);
  const filterOptions = useLinkageCollectionFilterOptions(collection);
  const formCollapse = FormCollapse.createFormCollapse(['measures', 'dimensions', 'sort', 'filter']);
  return (
    <SchemaComponent
      schema={querySchema}
      scope={{ t, formCollapse, fields, filterOptions, useFormatterOptions }}
      components={{
        ArrayItems,
        Editable,
        FormCollapse,
        Card,
        Switch,
        Select,
        Input,
        FormItem,
        Radio,
        Space,
        Filter,
      }}
    />
  );
};

ChartConfigure.Config = function Config() {
  const { t } = useChartsTranslation();
  const chartTypes = useChartTypes();
  const fields = useFields();
  const libraries = useContext(ChartLibraryContext);
  const useChartFields = useAllFields(fields);
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
            scope={{ t, chartTypes, useChartFields }}
            components={{ Card, Select, Input, FormItem, ArrayItems, Space }}
          />
        );
      }}
    </FormConsumer>
  );
};
