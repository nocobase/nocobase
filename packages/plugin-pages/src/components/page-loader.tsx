import React, { useState } from 'react';
import { TemplateLoader } from './template-loader';
import { useRequest, request } from '@nocobase/ui';

export function PageLoader(props: any) {
  const { path } = props.match.params;
  const { data = {}, error, loading, run } = useRequest(() => request('/routes'));
  const [first, setFirst] = useState(true);
  // @ts-ignore
  window.routesReload = async () => {
    setFirst(false);
    await run();
  };
  // const routes = pages2routes(data);
  console.log(data);
  return (
    <TemplateLoader
      {...props}
      loading={loading && first}
      pages={data.data||{}}
      pathname={`/${path}`}
    />
  );
}
