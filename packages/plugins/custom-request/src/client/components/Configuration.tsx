import { useCompile } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

const Configuration = () => {
  const compile = useCompile();
  return <Card bordered>123custom-request-configuration</Card>;
};

export default Configuration;
