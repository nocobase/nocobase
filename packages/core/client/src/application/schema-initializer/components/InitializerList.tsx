import { Space } from 'antd';
import React, { FC } from 'react';

export const InitializerList: FC<any> = (props) => {
  const { style = {}, children, ...others } = props;
  return (
    <Space direction="vertical" size={'middle' as any} {...others} style={{ display: 'flex', ...style }}>
      {children}
    </Space>
  );
};
