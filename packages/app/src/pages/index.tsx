import React, { useState } from 'react';
import { request, useRequest } from 'umi';
import PageLoader from '@/components/page-loader';
import templates from '@/templates';

export default (props: any) => {
  const { path } = props.match.params;
  const { data = {}, error, loading, run } = useRequest(() => request('/routes'));
  const [first, setFirst] = useState(true);
  // @ts-ignore
  window.routesReload = async () => {
    setFirst(false);
    await run();
  };
  // const routes = pages2routes(data);
  // console.log(routes);
  return (
    <PageLoader
      {...props}
      templates={templates}
      loading={loading && first}
      pages={data}
      pathname={`/${path}`}
    />
  );
}
