import { useChartsTranslation } from '../locale';
import React, { createContext, useContext, useMemo } from 'react';
import { Row, Col, Card, Modal, Button, Space, Tabs } from 'antd';
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
import { useFields } from './hooks';
import { cloneDeep } from 'lodash';

export type ChartConfigCurrent = {
  schema: ISchema;
  field: any;
  collection: any;
};

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  current?: ChartConfigCurrent;
  setCurrent?: (current: ChartConfigCurrent) => void;
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
  Query: React.FC;
} = (props) => {
  const { t } = useChartsTranslation();
  const { visible, setVisible, current } = useContext(ChartConfigContext);
  const { schema, field, collection } = current || {};
  const { dn } = useDesignable();
  const { insert } = props;
  const RunButton: React.FC = () => (
    <Button type="link">
      <RightSquareOutlined />
      {t('Run query')}
    </Button>
  );
  const chartTypes = useChartTypes();
  const libraries = useContext(ChartLibraryContext);
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          query: schema?.['x-component-props']?.query,
          config: schema?.['x-component-props']?.config,
        },
      }),
    [schema],
  );
  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        const { query, config } = form.values;
        console.log(query);
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
            type: 'object',
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
                        scope={{ t, chartTypes }}
                        components={{ Card, Select, Input, FormItem }}
                      />
                    );
                  }}
                </FormConsumer>
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
        const query = cloneDeep(form.values.query);
        const config = cloneDeep(form.values.config);
        return <ChartRenderer collection={collection} query={query} config={config} />;
      }}
    </FormConsumer>
  );
};

ChartConfigure.Query = function Query() {
  const { t } = useChartsTranslation();
  const { current } = useContext(ChartConfigContext);
  const { collection } = current || {};
  const fields = useFields();
  const filterOptions = useLinkageCollectionFilterOptions(collection);
  const formCollapse = FormCollapse.createFormCollapse(['measure', 'dimension', 'sort', 'filter']);
  return (
    <SchemaComponent
      schema={querySchema}
      scope={{ t, formCollapse, fields, filterOptions }}
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
