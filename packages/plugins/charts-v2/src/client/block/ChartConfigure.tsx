import { useChartsTranslation } from '../locale';
import React, { createContext, useContext, useMemo } from 'react';
import { Row, Col, Card, Modal, Button, Space } from 'antd';
import { ArrayItems, Editable, FormCollapse, Switch } from '@formily/antd';
import { SchemaComponent, Filter, gridRowColWrap, Select, Input, Radio, useDesignable } from '@nocobase/client';
import { css } from '@emotion/css';
import { configSchema, querySchema } from './schemas/configure';
import { ISchema, FormConsumer } from '@formily/react';
import { ChartRenderer, ChartRendererProps, useChartTypes } from '../renderer';
import { Form, FormItem } from '@formily/antd';
import { RightSquareOutlined } from '@ant-design/icons';
import { Form as FormType, createForm } from '@formily/core';

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
  current?: {
    schema: ISchema;
    field: any;
  };
  setCurrent?: (current: { schema: ISchema; field: any }) => void;
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
}> = (props) => {
  const { t } = useChartsTranslation();
  const { visible, setVisible, current } = useContext(ChartConfigContext);
  const { schema, field } = current || {};
  const { dn } = useDesignable();
  const { insert } = props;
  const formCollapse = FormCollapse.createFormCollapse(['measure', 'dimension', 'sort', 'filter']);
  const RunButton: React.FC = () => (
    <Button type="link">
      <RightSquareOutlined />
      {t('Run query')}
    </Button>
  );
  const chartTypes = useChartTypes();
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
        if (schema && schema['x-uid']) {
          schema['x-component-props'] = {
            query,
            config,
          };
          field.componentProps = {
            query,
            config,
          };
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
            'x-component-props': {
              query,
              config,
            },
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
                  <FormConsumer>
                    {(form) => {
                      const query = { ...form.values.query };
                      const config = { ...form.values.config };
                      return <ChartRenderer query={query} config={config} />;
                    }}
                  </FormConsumer>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col
                className={css`
                  width: 100%;
                `}
              >
                <SchemaComponent
                  schema={configSchema}
                  scope={{ t, chartTypes }}
                  components={{ Card, Select, Input, FormItem }}
                />
              </Col>
            </Row>
          </Col>
          <Col span={9}>
            <Card title={t('Query')} extra={<RunButton />}>
              <SchemaComponent
                schema={querySchema}
                scope={{ t, formCollapse }}
                components={{
                  ArrayItems,
                  Editable,
                  Filter,
                  FormCollapse,
                  Card,
                  Switch,
                  Select,
                  Input,
                  FormItem,
                  Radio,
                  Space,
                }}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
