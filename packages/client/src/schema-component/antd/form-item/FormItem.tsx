import { FormItem as Item } from '@formily/antd';
import React from 'react';
import { BlockItem } from '../block-item';

export const FormItem: React.FC = (props) => {
  return (
    <BlockItem className={'nb-form-item'}>
      <Item {...props} />
    </BlockItem>
  );
};
