import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { SchemaRenderer } from '../../schemas';

export function DefaultPage({ route }) {
  const { data = {}, loading } = useRequest(
    `/api/ui-schemas:getTree/${route.schemaName}`,
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
