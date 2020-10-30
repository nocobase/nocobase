import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export default function (props: any) {
  return (
    <Spin size={'large'} className={'spinning--absolute'} indicator={icon} {...props}></Spin>
  );
}
