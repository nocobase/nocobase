import { useChartsTranslation } from '../locale';
import React, { createContext, useContext } from 'react';
import { Modal } from 'antd';
import { Row, Col, Card } from 'antd';
import { ArrayItems, Editable } from '@formily/antd';
import { SchemaComponent, Filter, gridRowColWrap } from '@nocobase/client';
import { css } from '@emotion/css';
import { configSchema } from './schemas/configure';
import { ISchema } from '@formily/react';
import { ChartRenderer } from '../renderer';

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
  return (
    <Modal
      title={t('Configure chart')}
      open={visible}
      onOk={() => {
        insert(
          {
            type: 'object',
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
      <Row>
        <Col
          flex={3}
          className={css`
            margin-right: 5px;
          `}
        >
          <ChartRenderer />
        </Col>
        <Col
          flex={3}
          className={css`
            width: 35%;
            margin-left: 5px;
          `}
        >
          <Card>
            <SchemaComponent schema={configSchema} scope={{ t }} components={{ ArrayItems, Editable, Filter }} />
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};
