import React from 'react';
import { Outlet } from 'react-router-dom';
import { Card } from 'antd';

export const SettingMultiPageLayout = () => {
  return (
    <Card bordered={false}>
      <Outlet />
    </Card>
  );
};
