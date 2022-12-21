import { RecursionField, useFieldSchema } from '@formily/react';
import { Card, Col, Row } from 'antd';
import React from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';

export const CardItem: React.FC = (props) => {
  const { children, ...restProps } = props;
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema['x-template-key'];

  const hasFilter = !!Object.entries(fieldSchema.properties).find(([, schema]) => {
    return schema['x-component'] === 'AssociationFieldsFilter';
  })?.[1];

  return templateKey && !template ? null : (
    <BlockItem className={'noco-card-item'}>
      <Card style={{ marginBottom: 24 }} bordered={false} {...restProps}>
        <Row>
          <Col span={hasFilter ? 4 : 0}>
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'AssociationFieldsFilter'}
            />
          </Col>
          <Col span={hasFilter ? 20 : 24}>
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'ActionBar'}
            />
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'TableV2'}
            />
          </Col>
        </Row>
      </Card>
    </BlockItem>
  );
};
