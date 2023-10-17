import { ButtonProps, ListProps, Space } from 'antd';
import React, { FC } from 'react';
import { InitializerChildren } from './InitializerChildren';
import { SchemaInitializerOptions } from '../types';

export type InitializerItemsProps<P1 = ButtonProps, P2 = ListProps<any>> = P2 & {
  options?: SchemaInitializerOptions<P1, P2>;
  items?: SchemaInitializerOptions['items'];
};

export const InitializerItems: FC<InitializerItemsProps> = (props) => {
  const { style = {}, options, items, ...others } = props;
  return (
    <Space direction="vertical" size={'middle' as any} {...others} style={{ display: 'flex', ...style }}>
      <InitializerChildren>{items}</InitializerChildren>
    </Space>
  );
};
