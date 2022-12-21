import { RecursionField, useFieldSchema } from '@formily/react';
import { Card, Col, Row } from 'antd';
import React from 'react';
import { css } from '@emotion/css';
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
          {hasFilter ? (
            <Col
              className={css`
                width: 200px;
                flex: 0 0 auto;
              `}
            >
              <RecursionField
                schema={fieldSchema}
                onlyRenderProperties
                filterProperties={(s) => s['x-component'] === 'AssociationFieldsFilter'}
              />
            </Col>
          ) : null}
          <Col
            className={css`
              flex: 1 1 auto;
            `}
          >
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] !== 'AssociationFieldsFilter'}
            />
          </Col>
        </Row>
      </Card>
    </BlockItem>
  );
};
