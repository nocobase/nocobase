import { useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useSchemaTemplate } from '../../../schema-templates';
import { BlockItem } from '../block-item';

export const CardItem: React.FC = (props) => {
  const { children, ...restProps } = props;
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const templateKey = fieldSchema['x-template-key'];

  return templateKey && !template ? null : (
    <BlockItem className={'noco-card-item'}>
      <Card style={{ marginBottom: 'var(--nb-spacing)' }} bordered={false} {...restProps}>
        {props.children}
      </Card>
    </BlockItem>
  );
};
