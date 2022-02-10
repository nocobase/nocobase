import { Card } from 'antd';
import React from 'react';
import { BlockItem } from '../block-item';

export const CardItem: React.FC = (props) => {
  return (
    <BlockItem className={'noco-card-item'}>
      <Card style={{ marginBottom: 24 }} bordered={false} {...props}>
        {props.children}
      </Card>
    </BlockItem>
  );
};
