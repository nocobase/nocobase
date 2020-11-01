import React from 'react';
import { Spin as AntdSpin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export function Spin(props: any) {
  return (
    <AntdSpin size={'large'} className={'spinning--absolute'} indicator={icon} {...props}/>
  );
}
