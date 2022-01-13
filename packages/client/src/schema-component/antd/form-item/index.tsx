import React from 'react';
import { BlockItem } from '../block-item';
import { FormItem as FormilyFormItem } from '@formily/antd';

export const FormItem: React.FC = (props) => {
  return (
    <BlockItem className={'nb-form-item'}>
      <FormilyFormItem {...props} />
    </BlockItem>
  );
};
