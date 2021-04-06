import React, { useState } from 'react';
import { TemplateLoader } from './TemplateLoader';
import { useRequest } from 'umi';
import { templates } from '@/pages';
import api from '@/api-client';

export function PageLoader(props: any) {
  const { path } = props.match.params;
  const { data = {}, error, loading, run } = useRequest(() =>
    api.resource('pages').getRoutes(),
  );
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
      pages={data || {}}
      pathname={`/${path}`}
    />
  );
}

export default PageLoader;
