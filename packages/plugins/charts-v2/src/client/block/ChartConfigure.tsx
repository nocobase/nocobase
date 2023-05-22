import { useChartsTranslation } from '../locale';
import React, { createContext, useContext } from 'react';
import { Row, Col, Card, Modal, Button } from 'antd';
import { ArrayItems, Editable, FormCollapse, Switch } from '@formily/antd';
import { SchemaComponent, Filter, gridRowColWrap } from '@nocobase/client';
import { css } from '@emotion/css';
import { configSchema, querySchema } from './schemas/configure';
import { ISchema } from '@formily/react';
import { ChartRenderer } from '../renderer';
import { Form } from '@formily/antd';
import { RightSquareOutlined } from '@ant-design/icons';

export const ChartConfigContext = createContext<{
  visible: boolean;
  setVisible?: (visible: boolean) => void;
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
  const { visible, setVisible } = useContext(ChartConfigContext);
  const { insert } = props;
  const formCollapse = FormCollapse.createFormCollapse(['measure', 'dimension', 'sort', 'filter']);
  const RunButton: React.FC = () => (
    <Button type="link">
      <RightSquareOutlined />
      {t('Run query')}
    </Button>
  );
  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        insert(
          {
            type: 'object',
            'x-decorator': 'CardItem',
            'x-component': 'ChartRenderer',
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
      <Form layout="vertical">
        <Row>
          <Col flex={3}>
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
                  <ChartRenderer />
                </Card>
              </Col>
            </Row>
            <Row>
              <Col
                className={css`
                  width: 100%;
                `}
              >
                <SchemaComponent schema={configSchema} scope={{ t }} components={{ Card }} />
              </Col>
            </Row>
          </Col>
          <Col
            flex={3}
            className={css`
              margin-left: 10px;
              width: 40%;
            `}
          >
            <Card title={t('Query')} extra={<RunButton />}>
              <SchemaComponent
                schema={querySchema}
                scope={{ t, formCollapse }}
                components={{ ArrayItems, Editable, Filter, FormCollapse, Card, Switch }}
              />
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
