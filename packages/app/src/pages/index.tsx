import React, { useEffect } from 'react';
import { Spin } from 'antd';
import {
  RouteSwitch,
  useGlobalAction,
  loadBlocks,
  loadTemplates,
  templates,
} from '@nocobase/client';

loadBlocks();
loadTemplates();

export default function IndexPage() {
  const { data, loading } = useGlobalAction('routes:getAccessible');
  console.log({ data });
  if (loading) {
    return <Spin />;
  }
  return <RouteSwitch components={templates} routes={data} />;
}
