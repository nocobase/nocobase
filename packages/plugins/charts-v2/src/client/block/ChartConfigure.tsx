import { useChartsTranslation } from '../locale';
import React, { createContext, useContext, useMemo } from 'react';
import { Row, Col, Card, Modal, Button, Space } from 'antd';
import { ArrayItems, Editable, FormCollapse, Switch } from '@formily/antd';
import { SchemaComponent, Filter, gridRowColWrap, Select, Input, Radio, useDesignable } from '@nocobase/client';
import { css } from '@emotion/css';
import { configSchema, querySchema } from './schemas/configure';
import { ISchema, FormConsumer, Schema } from '@formily/react';
import { ChartRenderer, useChartTypes } from '../renderer';
import { Form, FormItem } from '@formily/antd';
import { RightSquareOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { FieldOption, useFields, useFilterOptions } from './hooks';

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
              <ChartConfigure.Query />
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

ChartConfigure.Renderer = () => (
  <FormConsumer>
    {(form) => {
      const query = { ...form.values.query };
      const config = { ...form.values.config };
      return <ChartRenderer query={query} config={config} />;
    }}
  </FormConsumer>
);

const FieldComponent: React.FC<{
  fields: FieldOption[];
  component: React.FC<{
    allFields: FieldOption[];
  }>;
}> = (props) => {
  const { fields } = props;
  return (
    <FormConsumer>
      {(form) => {
        // When field alias is set, appends it to the field list
        const getAliasFields = (selectedFields: { field: string; aggregation: string; alias?: string }[]) => {
          return selectedFields
            .filter((selectedField) => selectedField.alias)
            .map((selectedField) => {
              const fieldProps = fields.find((field) => field.name === selectedField.field);
              if (selectedField.aggregation) {
                // If aggregation is set, set the field type to number
                fieldProps.type = 'number';
                fieldProps.interface = 'number';
              }
              return {
                ...fieldProps,
                key: selectedField.alias,
                label: selectedField.alias,
                value: selectedField.alias,
              };
            });
        };
        const query = form.values.query || {};
        const measures = query.measures || [];
        const dimensions = query.dimensions || [];
        const aliasFields = [...getAliasFields(measures), ...getAliasFields(dimensions)];
        // unique
        const map = new Map([...fields, ...aliasFields].map((item) => [item.value, item]));
        const allFields = [...map.values()];
        return props.component({ ...props, allFields });
      }}
    </FormConsumer>
  );
};

const FieldSelect: React.FC<{
  fields: FieldOption[];
}> = (props) => {
  return (
    <FieldComponent
      fields={props.fields}
      component={(props) => {
        return <Select {...props} options={props.allFields} />;
      }}
    />
  );
};

const FieldFilter: React.FC<{
  fields: FieldOption[];
}> = (props) => {
  const F = (props: { allFields: FieldOption[] }) => {
    const options = useFilterOptions(props.allFields);
    return <Filter {...props} options={options} />;
  };
  return <FieldComponent fields={props.fields} component={(props) => <F {...props} />} />;
};

ChartConfigure.Query = function Query() {
  const fields = useFields();
  const { t } = useChartsTranslation();
  const formCollapse = FormCollapse.createFormCollapse(['measure', 'dimension', 'sort', 'filter']);
  return (
    <SchemaComponent
      schema={querySchema}
      scope={{ t, formCollapse, fields }}
      components={{
        ArrayItems,
        Editable,
        FieldFilter,
        FormCollapse,
        Card,
        Switch,
        Select,
        Input,
        FormItem,
        Radio,
        Space,
        FieldSelect,
      }}
    />
  );
};
