import React from 'react';
import { Card } from 'antd';
import { BlockItem } from '../block-item';

export const CardItem: React.FC = (props) => {
  return (
    <BlockItem className={'noco-card-item'}>
      <Card bordered={false} {...props}>
        {props.children}
      </Card>
    </BlockItem>
  );
};
