import { Space } from 'antd';
import React, { FC } from 'react';
import { SchemaInitializerOptions } from '../types';

export const InitializerList: FC<SchemaInitializerOptions> = (props) => {
  const { listProps, listStyle, children } = props;
  return (
    <Space direction="vertical" size={'middle' as any} {...listProps} style={{ display: 'flex', ...listStyle }}>
      {children}
    </Space>
  );
};
