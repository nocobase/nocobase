import React, { useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useRequest } from 'ahooks';
import { SchemaRenderer } from '../../schemas';

export function RouteSchemaRenderer({ route }) {
  const { data = {}, loading } = useRequest(
    `ui_schemas:getTree/${route.uiSchemaKey}`,
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

export default RouteSchemaRenderer;
