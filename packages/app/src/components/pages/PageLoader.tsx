import React, { useState } from 'react';
// import { request } from 'umi';
import { TemplateLoader } from './TemplateLoader';
import { useRequest, request } from '@nocobase/client';
import templates from '@/templates';

export function PageLoader(props: any) {
  const { path } = props.match.params;
  const { data = {}, error, loading, run } = useRequest(() => request('/routes'));
  const [first, setFirst] = useState(true);
  (window as any).routesReload = async () => {
    setFirst(false);
    await run();
  };
  console.log(data);
  return (
    <TemplateLoader
      {...props}
      templates={templates}
      loading={loading && first}
      pages={data.data||{}}
      pathname={`/${path}`}
    />
  );
}

export default PageLoader;
