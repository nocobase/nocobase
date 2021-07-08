import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { SchemaRenderer } from '../../schemas';

export function DefaultPage({ route }) {
  const { data = {}, loading } = useRequest(
    `/api/blocks:getSchema/${route.blockId}`,
    {
      refreshDeps: [route],
      formatResult: (result) => result?.data,
    },
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <SchemaRenderer schema={data} />
    </div>
  );
}

export default DefaultPage;
